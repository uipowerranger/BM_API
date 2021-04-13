var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var StateSchema = new Schema(
  {
    unit_name: { type: String, required: true },
    status: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("units", StateSchema);
