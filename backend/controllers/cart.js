const Cart = require("../models/Cart");
const cartRouter = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { tokenExtractor } = require("../utils/middleware");
const logger = require("../utils/logger");

/**********  GET CART PRODUCTS  **********/

cartRouter.get("/", tokenExtractor, async (req, res) => {
  const cart = await Cart.find({ userId: req.user._id });
  res.json(cart);
});

/**********  POST PRODUCTS TO CART  **********/

cartRouter.post("/", tokenExtractor, async (req, res) => {
  try {
    const { productId, quantity, size = "" } = req.body;

    const user = req.user;

    // prune stale cartItem references
    const validCartItems = await Cart.find({ _id: { $in: user.cartItems } });
    const validIds = new Set(validCartItems.map((i) => i._id.toString()));
    if (user.cartItems.length !== validCartItems.length) {
      user.cartItems = user.cartItems.filter((id) => validIds.has(id.toString()));
      await user.save();
    }

    const existingCartItem = await Cart.findOne({
      userId: user._id,
      productId,
      size: size || "",
    });

    let stripeProd;
    try {
      stripeProd = await stripe.products.retrieve(productId, {
        expand: ["default_price"],
      });

      if (!stripeProd.default_price) {
        return res.status(400).json({ error: "Product has no price configured" });
      }
    } catch (stripeError) {
      logger.error("Stripe error:", stripeError);
      return res.status(400).json({
        error: "Invalid product ID or product not found in Stripe",
        details: stripeError.message
      });
    }

    let updatedCartItem;
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      updatedCartItem = await existingCartItem.save();
    } else {
      const newCartProduct = new Cart({
        userId: user._id,
        productId: productId,
        name: stripeProd.name,
        desc: stripeProd.description || "",
        img: stripeProd.images?.[0] || "",
        quantity: quantity,
        price: stripeProd.default_price.unit_amount,
        category: stripeProd.metadata?.category || "uncategorized",
        size: size || "",
      });

      updatedCartItem = await newCartProduct.save();
      user.cartItems.push(updatedCartItem._id);
      await user.save();
    }

    const updatedCart = await Cart.find({ userId: user._id });
    return res.json(updatedCart);

  } catch (error) {
    logger.error("Cart operation error:", error.message);
    return res.status(500).json({
      error: "Failed to add product to cart",
      details: error.message
    });
  }
});

cartRouter.patch("/:id", tokenExtractor, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;

    const cartItem = await Cart.findOne({ _id: id, userId: req.user._id });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (quantity <= 0) {
      await Cart.findByIdAndDelete(cartItem._id);
      req.user.cartItems = req.user.cartItems.filter(
        (item) => item.toString() !== id
      );
      await req.user.save();
    } else {
      cartItem.quantity = quantity;
      await cartItem.save();
    }

    const updatedCart = await Cart.find({ userId: req.user._id });
    return res.json(updatedCart);
  } catch (error) {
    logger.error("Cart update error:", error.message);
    return res.status(500).json({ error: "Failed to update cart", details: error.message });
  }
});

cartRouter.delete("/", tokenExtractor, async (req, res) => {
  const { productId } = req.body;

  const existingItem = await Cart.findOne({
    userId: req.user._id,
    productId,
  });

  if (existingItem) {
    await Cart.findByIdAndDelete(existingItem._id);
    req.user.cartItems = req.user.cartItems.filter(
      (id) => id.toString() !== existingItem._id.toString()
    );
    await req.user.save();
  }

  const updatedCart = await Cart.find({ userId: req.user._id });
  return res.json(updatedCart);
});

module.exports = cartRouter;
