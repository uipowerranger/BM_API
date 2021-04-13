var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CauroselScheme = new Schema(
  {
    description: { type: String, required: true },
    image: { type: String, require: false, default: "" },
    category: { type: Schema.ObjectId, ref: "categories", required: true },
    state: { type: Schema.ObjectId, ref: "states", required: true },
    status: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("caurosels", CauroselScheme);
