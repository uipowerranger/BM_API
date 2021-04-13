var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ProductSchema = new Schema(
  {
    offer_from_date: { type: Date, required: true, default: new Date() },
    offer_to_date: { type: Date, required: true, default: new Date() },
    items_available: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    actualPrice: { type: Number, required: true, default: 0 },
    weight: { type: String, required: true },
    category_details: {
      type: Schema.ObjectId,
      ref: "categories",
      required: true,
    },
    sub_category_details: {
      type: Schema.ObjectId,
      ref: "sub_categories",
      required: true,
    },
    state_details: {
      type: Schema.ObjectId,
      ref: "states",
      required: true,
    },
    post_code_details: {
      type: Schema.ObjectId,
      ref: "postcodes",
      required: true,
    },
    deal_details: { type: String, required: false, default: "" },
    image: { type: String, required: false },
    offer_details: { type: String, required: false, default: "" },
    has_deal: { type: Boolean, required: true, default: 0 },
    has_offer: { type: Boolean, required: true, default: 0 },
    home_page_display: { type: Boolean, required: true, default: 1 },
    item_name: { type: String, required: true },
    user: { type: Schema.ObjectId, ref: "admins", required: true },
    status: { type: Number, required: true, default: 1 },
    homepage_filter: { type: String, required: false, default: "" },
    description: { type: String, required: false, default: "" },
    units: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("products", ProductSchema);
