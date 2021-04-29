const FiltersModel = require("../models/FiltersModel");
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
  auth,
  body("filter_name", "Filter name is required").exists().isString(),
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
        var order = new FiltersModel({
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
            "Filter Created successfully",
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

exports.list = [
  function (req, res) {
    try {
      FiltersModel.find({ status: { $ne: 3 } }).then((orders) => {
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

exports.update = [
  auth,
  body("filter_name", "Filter name is required").exists().isString(),
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
        FiltersModel.findByIdAndUpdate(
          req.params.id,
          { filter_name: req.body.filter_name },
          { new: true },
          function (err, data) {
            if (err) {
              return apiResponse.ErrorResponse(res, err);
            }
            return apiResponse.successResponseWithData(
              res,
              "Filter Updated successfully",
              data
            );
          }
        );
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.delete = [
  auth,
  function (req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return apiResponse.validationErrorWithData(
        res,
        "Invalid Error.",
        "Invalid ID"
      );
    }
    try {
      FiltersModel.findById(req.params.id, function (err, foundCategory) {
        if (foundCategory === null) {
          return apiResponse.notFoundResponse(
            res,
            "Filter not exists with this id"
          );
        } else {
          //delete Category.
          FiltersModel.findByIdAndUpdate(
            req.params.id,
            { status: 3 },
            {},
            function (err) {
              if (err) {
                return apiResponse.ErrorResponse(res, err);
              } else {
                return apiResponse.successResponse(
                  res,
                  "Filter delete Success."
                );
              }
            }
          );
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
