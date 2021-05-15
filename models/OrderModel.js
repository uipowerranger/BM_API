var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var OrderSchema = new mongoose.Schema(
  {
    user: { type: Schema.ObjectId, ref: "users", required: true },
    items: [
      {
        item_id: { type: Schema.ObjectId, ref: "products", required: true },
        item_name: { type: String, required: true },
        item_image: { type: String, required: false },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true, default: 1 },
        amount: { type: Number, required: true, default: 1 },
      },
    ],
    order_date: { type: Date, required: true, default: new Date() },
    status: { type: Number, required: true, default: 1 },
    total_amount: { type: Number, required: true },
    email_id: { type: String, required: true },
    phone_number: { type: String, required: true },
    alternate_phone: { type: String, required: false, default: "" },
    mailing_address: {
      address1: { type: String, required: true, default: "" },
      address2: { type: String, required: false, default: "" },
      city: { type: String, required: true, default: "" },
      state: { type: String, required: true, default: "" },
      postcode: { type: String, required: true, default: "" },
    },
    shipping_address: {
      address1: { type: String, required: true, default: "" },
      address2: { type: String, required: false, default: "" },
      city: { type: String, required: true, default: "" },
      state: { type: String, required: true, default: "" },
      postcode: { type: String, required: true, default: "" },
    },
    payment: { type: Boolean, required: false, default: 0 },
    order_completed: { type: Boolean, required: false, default: 0 },
    state_details: { type: Schema.ObjectId, ref: "states", required: true },
    redeempoints_used: { type: Number, required: false, default: 0 },
    delivery_charges: { type: Number, required: false, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("orders", OrderSchema);
