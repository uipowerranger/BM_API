const CitiesModel = require("../models/CitiesModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

exports.CityListByState = [
  function (req, res) {
    try {
      CitiesModel.aggregate([
        {
          $match: {
            status: { $ne: 3 },
            state_id: mongoose.Types.ObjectId(req.params.state_id),
          },
        },
      ]).then((categories) => {
        if (categories.length > 0) {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            categories
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

/**
 * Category store.
 *
 * @param {string}      category_name
 *
 * @returns {Object}
 */
exports.CityStore = [
  auth,
  body("city_name", "City Name must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape(),
  body("state_id", "State must not be empty.").isLength({ min: 1 }).trim(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new CitiesModel({
        city_name: req.body.city_name,
        state_id: req.body.state_id,
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        //Save Category.
        category.save(function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          return apiResponse.successResponseWithData(
            res,
            "City add Success.",
            category
          );
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
