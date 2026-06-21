const orderRouter = require("express").Router();
const Order = require("../models/Order");
const { tokenExtractor } = require("../utils/middleware");

// List the authenticated user's orders, newest first.
orderRouter.get("/", tokenExtractor, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// Public order lookup by Stripe session id — used by the post-payment success
// page (works for guest checkouts too). The cs_ session id is an unguessable
// capability token, so no auth is required.
orderRouter.get("/session/:sessionId", async (req, res) => {
  const order = await Order.findOne({ stripeSessionId: req.params.sessionId });
  if (!order) {
    return res.status(404).json({ error: "order not found" });
  }
  res.json(order);
});

module.exports = orderRouter;
