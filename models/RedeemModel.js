var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var RedeemSchema = new Schema(
  {
    date: { type: Date, required: true, default: new Date() },
    user: { type: Schema.ObjectId, ref: "users", required: true },
    order_id: { type: Schema.ObjectId, ref: "orders", required: true },
    total_amount: { type: Number, required: true },
    redeem_points: { type: Number, required: true },
    status: { type: Number, required: true, default: 1 }, //status = 1 - Redeem earned, status = 2 - Redeem used
  },
  { timestamps: true }
);

module.exports = mongoose.model("redeempoints", RedeemSchema);
