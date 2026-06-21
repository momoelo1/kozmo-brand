const checkoutRouter = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const Cart = require("../models/Cart");
const User = require("../models/User");
const Order = require("../models/Order");
const { tokenExtractor } = require("../utils/middleware");

const CLIENT_URLS = [process.env.CLIENT_URL, process.env.CLIENT_URL_ALT].filter(Boolean);
const FALLBACK_CLIENT = (CLIENT_URLS[0] || "").replace(/\/$/, "");

const toOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

// Where did the browser request come from? Prefer the Origin header (reliable
// cross-origin, e.g. the deployed site). In local dev the request reaches us
// through the Vite proxy, so fall back to the forwarded host, then Referer.
const getRequestOrigin = (req) => {
  const direct = toOrigin(req.get("origin") || "");
  if (direct) return direct;
  const xfHost = req.get("x-forwarded-host");
  if (xfHost) return `${req.get("x-forwarded-proto") || "http"}://${xfHost}`;
  return toOrigin(req.get("referer") || "");
};

// Redirect back to the configured client whose origin matches the request
// (so desktop→localhost, phone→LAN IP, prod→the GitHub Pages URL incl. subpath).
// Matching against an allowlist means a spoofed header can't cause an open redirect.
const resolveClient = (req) => {
  const reqOrigin = getRequestOrigin(req);
  const match = CLIENT_URLS.find((u) => toOrigin(u) === reqOrigin);
  return (match || FALLBACK_CLIENT).replace(/\/$/, "");
};

checkoutRouter.post(
  "/create-checkout-session",
  tokenExtractor,
  async (req, res) => {
    try {
      const user = await req.user.populate("cartItems");

      if (!user) {
        return res.status(404).json({ error: "user not found" });
      }

      const cartItems = await Cart.find({ userId: user._id });

      if (cartItems.length === 0) {
        return res.status(400).json({ error: "cart empty" });
      }

      const lineItems = cartItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
            ...(item.desc && { description: item.desc }),
            ...(item.img && { images: [item.img] }),
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      }));

      const CLIENT = resolveClient(req);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${CLIENT}/#/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT}/#/`,
        metadata: { userId: user._id.toString() },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("checkout session error", error);
      res.status(500).json({
        error: "failed to create checkout",
        details: error.message,
      });
    }
  },
);

checkoutRouter.post("/create-checkout-session-guest", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "cart empty" });
    }

    const enriched = await Promise.all(
      items.map(async (item) => {
        if (!item.productId) {
          throw new Error("missing productId");
        }

        const prod = await stripe.products.retrieve(item.productId, {
          expand: ["default_price"],
        });

        if (!prod.active) {
          throw new Error(`product not available: ${item.productId}`);
        }
        if (!prod.default_price?.unit_amount) {
          throw new Error(`no price configured: ${item.productId}`);
        }

        const quantity = Math.min(
          Math.max(parseInt(item.quantity, 10) || 1, 1),
          99,
        );

        return {
          lineItem: {
            price_data: {
              currency: "eur",
              product_data: {
                name: item.size ? `${prod.name} — Size ${item.size}` : prod.name,
                ...(prod.description && { description: prod.description }),
                ...(prod.images?.[0] && { images: [prod.images[0]] }),
              },
              unit_amount: prod.default_price.unit_amount,
            },
            quantity,
          },
          snapshot: {
            productId: item.productId,
            name: prod.name,
            price: prod.default_price.unit_amount,
            quantity,
            size: item.size || "",
          },
        };
      }),
    );

    const lineItems = enriched.map((e) => e.lineItem);
    const snapshot = enriched.map((e) => e.snapshot);

    const CLIENT = resolveClient(req);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${CLIENT}/#/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT}/#/cart?cancelled=true`,
      // Guest sessions carry no userId; stash a compact item snapshot so the
      // webhook can persist the order. Stripe caps each value at 500 chars —
      // fine for this shop's small carts.
      metadata: { items: JSON.stringify(snapshot) },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("guest checkout session error", error);
    res.status(500).json({
      error: "failed to create checkout",
      details: error.message,
    });
  }
});

checkoutRouter.post("/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("signature error");
    return res.status(400).send(`webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId || null;

    try {
      // Idempotency: Stripe may deliver the same event more than once.
      const existing = await Order.findOne({ stripeSessionId: session.id });
      if (existing) {
        return res.json({ received: true });
      }

      // Build the item snapshot: authenticated → from the cart;
      // guest → from the metadata we stashed at session creation.
      let items = [];
      let user = null;

      if (userId) {
        user = await User.findById(userId);
        const cartItems = await Cart.find({ userId });
        items = cartItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size || "",
        }));
      } else if (session.metadata?.items) {
        try {
          items = JSON.parse(session.metadata.items);
        } catch {
          items = [];
        }
      }

      await Order.create({
        stripeSessionId: session.id,
        userId,
        email: session.customer_details?.email || "",
        items,
        amountTotal: session.amount_total,
        currency: session.currency || "eur",
        paymentStatus: session.payment_status,
      });

      // Clear the authenticated user's cart (unchanged behavior).
      if (user) {
        await Cart.deleteMany({ userId: user._id });
        user.cartItems = [];
        await user.save();
      }
    } catch (error) {
      console.error("error processing successful payment", error);
    }
  }

  res.json({ received: true });
});

module.exports = checkoutRouter;
