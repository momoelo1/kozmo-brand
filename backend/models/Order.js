const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // unit amount in cents, frozen at purchase
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String, default: "" },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    // Stripe checkout session id — unique so a replayed webhook can't duplicate an order.
    stripeSessionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: "" },
    items: { type: [OrderItemSchema], default: [] },
    amountTotal: { type: Number }, // total in cents, from the Stripe session
    currency: { type: String, default: "eur" },
    paymentStatus: { type: String }, // e.g. "paid"
  },
  { timestamps: true },
);

OrderSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Order", OrderSchema);
