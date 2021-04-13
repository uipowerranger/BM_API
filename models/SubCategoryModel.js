var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CategorySchema = new Schema(
  {
    sub_category_name: { type: String, required: true },
    category: { type: Schema.ObjectId, ref: "categories", required: true },
    status: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("sub_categories", CategorySchema);
