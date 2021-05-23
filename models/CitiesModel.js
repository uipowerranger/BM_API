var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CitySchema = new Schema(
  {
    city_name: { type: String, required: true },
    state_id: { type: Schema.ObjectId, ref: "states", required: true },
    status: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("cities", CitySchema);
