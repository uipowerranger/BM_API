var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var EnquirySchema = new mongoose.Schema(
  {
    user: { type: Schema.ObjectId, ref: "users", required: false },
    enquiry_date: { type: Date, required: true, default: new Date() },
    status: { type: Number, required: true, default: 1 },
    email_id: { type: String, required: true },
    phone_number: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    post_code: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("enquiries", EnquirySchema);
