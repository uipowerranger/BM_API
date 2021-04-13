var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CheckoutSchema = new mongoose.Schema(
  {
    user: { type: Schema.ObjectId, ref: "users", required: true },
    item_id: { type: Schema.ObjectId, ref: "products", required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true, default: 1 },
    amount: { type: Number, required: true, default: 1 },
    checkout_date: { type: Date, required: true, default: new Date() },
    status: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("checkouts", CheckoutSchema);
