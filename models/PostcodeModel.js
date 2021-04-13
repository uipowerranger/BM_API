var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var PostcodeScheme = new Schema(
  {
    post_code: { type: String, required: true },
    state: { type: Schema.ObjectId, ref: "states", required: true },
    status: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("postcodes", PostcodeScheme);
