const EnquiryModel = require("../models/EnquiryModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

/**
 * User registration.
 *
 * @param {string}      first_name
 * @param {string}      last_name
 * @param {string}      email_id
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.create = [
  // Validate fields.
  body("email_id", "Email is required")
    .exists()
    .isEmail()
    .withMessage("Enter valid email"),
  body("phone_number", "Phone number is required and should be string")
    .exists()
    .isString(),
  body("first_name", "Firstname is required").exists().isString(),
  body("last_name", "Lastname is required").exists().isString(),
  body("post_code", "Postcode is required and should be number")
    .exists()
    .isNumeric(),
  // Process request after validation and sanitization.
  (req, res) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { _id, ...rest } = req.body;
        var order = new EnquiryModel({
          ...rest,
        });
        // Save order.
        order.save(function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          let orderData = {
            _id: order._id,
            createdAt: order.createdAt,
          };
          return apiResponse.successResponseWithData(
            res,
            "We have registered your enquiry We will comeback to you soon.",
            orderData
          );
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Orders List
 */

exports.EnquiryList = [
  function (req, res) {
    try {
      EnquiryModel.find().then((orders) => {
        if (orders.length > 0) {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            orders
          );
        } else {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            []
          );
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
