var mongoose = require( "mongoose" );
var Schema = mongoose.Schema;

var GiftSchema = new mongoose.Schema(
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
        mandatefield: { type: Boolean, required: true, default: false },
        iseditable: { type: Boolean, required: true, default: false },
        offer: { type: String, required: false, default: "" },

      },
    ],
    state_id: { type: Schema.ObjectId, ref: "states", required: true },
    state_name: { type: String, required: false },
    status: { type: Number, required: true, default: 1 },
    total_amount: { type: Number, required: true, default: 0 },
    box_name: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model( "giftbox", GiftSchema );
