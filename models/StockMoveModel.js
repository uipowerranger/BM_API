var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var StockSchema = new Schema(
  {
    date: { type: Date, required: true, default: new Date() },
    user: { type: Schema.ObjectId, ref: "users", required: true },
    order_id: { type: Schema.ObjectId, ref: "orders", required: true },
    item_id: { type: Schema.ObjectId, ref: "products", required: true },
    quantity: { type: Number, required: true },
    status: { type: Number, required: true, default: 1 },
    state: { type: String, required: false, default: "" },
    transactionType: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("stockmovements", StockSchema);
