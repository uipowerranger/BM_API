var mongoose = require( "mongoose" );
var Schema = mongoose.Schema;

var FiltersSchema = new mongoose.Schema(
  {
    user: { type: Schema.ObjectId, ref: "users", required: false },
    status: { type: Number, required: true, default: 1 },
    filter_name: { type: String, required: true },

    iseditable: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model( "filters", FiltersSchema );
