const checkoutRouter = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const Cart = require("../models/Cart");
const User = require("../models/User");
const { tokenExtractor } = require("../utils/middleware");

const CLIENT = process.env.CLIENT_URL_ALT || process.env.CLIENT_URL;

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

      const orderNames = encodeURIComponent(
        cartItems
          .slice(0, 3)
          .map((i) => i.name)
          .join(", "),
      );

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${CLIENT}/#/?payment=success&order=${orderNames}`,
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

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "cart empty" });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.size ? `${item.name} — Size ${item.size}` : item.name,
          ...(item.desc && { description: item.desc }),
          ...(item.img && { images: [item.img] }),
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    const orderNames = encodeURIComponent(
      items
        .slice(0, 3)
        .map((i) => i.name)
        .join(", "),
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${CLIENT}/?payment=success&order=${orderNames}`,
      cancel_url: `${CLIENT}/cart?cancelled=true`,
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
    const userId = session.metadata.userId;

    try {
      const user = await User.findById(userId);
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
