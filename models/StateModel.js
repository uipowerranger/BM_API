var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var StateSchema = new Schema(
  {
    state_name: { type: String, required: true },
    status: { type: Number, required: true, default: 1 },
    postcode_from: { type: Number, required: true, default: 0 },
    postcode_to: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("states", StateSchema);
