const CategoryModel = require("../models/CategoryModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Category Schema
function CategoryData(data) {
  this.id = data._id;
  this.category_name = data.category_name;
  this.state_details = data.state_details;
  this.post_code_details = data.post_code_details;
  this.createdAt = data.createdAt;
  this.image = data.image;
  this.order_number = data.order_number;
}

/**
 * Category List.
 *
 * @returns {Object}
 */
exports.CategoryList = [
  function (req, res) {
    try {
      CategoryModel.aggregate([
        { $sort: { order_number: 1 } },
        {
          $lookup: {
            from: "states",
            localField: "state_details",
            foreignField: "_id",
            as: "map_state",
          },
        },
        {
          $unwind: "$map_state",
        },
        {
          $lookup: {
            from: "postcodes",
            localField: "post_code_details",
            foreignField: "_id",
            as: "map_post_code",
          },
        },
        {
          $unwind: "$map_post_code",
        },
        { $match: { status: { $ne: 3 } } },
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
 * Category List by state.
 *
 * @returns {Object}
 */
exports.CategoryListByState = [
  function (req, res) {
    try {
      CategoryModel.aggregate([
        { $sort: { order_number: 1 } },
        {
          $match: {
            status: { $ne: 3 },
            state_details: mongoose.Types.ObjectId(req.params.state),
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
exports.CategoryStore = [
  auth,
  body("category_name", "Name must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape(),
  body("state_details", "State must not be empty.").isLength({ min: 1 }).trim(),
  body("order_number", "Order number must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("post_code_details", "Post code must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("image", "Image must not be empty.").isLength({ min: 1 }).trim(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new CategoryModel({
        category_name: req.body.category_name,
        state_details: req.body.state_details,
        post_code_details: req.body.post_code_details,
        image: req.body.image,
        order_number: req.body.order_number,
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
          let Category_Data = new CategoryData(category);
          return apiResponse.successResponseWithData(
            res,
            "Category add Success.",
            Category_Data
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
 * Category update.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.CategoryUpdate = [
  auth,
  body("category_name", "Name must not be empty.").isLength({ min: 1 }).trim(),
  body("status", "Status must not be empty.").isLength({ min: 1 }).trim(),
  body("state_details", "State must not be empty.").isLength({ min: 1 }).trim(),
  body("order_number", "Order Number must not be empty")
    .isLength({ min: 1 })
    .trim(),
  body("post_code_details", "Post code must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("image", "Image must not be empty.").isLength({ min: 1 }).trim(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new CategoryModel({
        category_name: req.body.category_name,
        state_details: req.body.state_details,
        post_code_details: req.body.post_code_details,
        status: req.body.status,
        image: req.body.image,
        order_number: req.body.order_number,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return apiResponse.validationErrorWithData(
            res,
            "Invalid Error.",
            "Invalid ID"
          );
        } else {
          CategoryModel.findById(req.params.id, function (err, foundCategory) {
            if (foundCategory === null) {
              return apiResponse.notFoundResponse(
                res,
                "Category not exists with this id"
              );
            } else {
              //update Category.
              CategoryModel.findByIdAndUpdate(
                req.params.id,
                category,
                {},
                function (err) {
                  if (err) {
                    return apiResponse.ErrorResponse(res, err);
                  } else {
                    let Category_Data = new CategoryData(category);
                    return apiResponse.successResponseWithData(
                      res,
                      "Category update Success.",
                      Category_Data
                    );
                  }
                }
              );
            }
          });
        }
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Category Delete.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.CategoryDelete = [
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
      CategoryModel.findById(req.params.id, function (err, foundCategory) {
        if (foundCategory === null) {
          return apiResponse.notFoundResponse(
            res,
            "Category not exists with this id"
          );
        } else {
          //delete Category.
          CategoryModel.findByIdAndUpdate(
            req.params.id,
            { status: 3 },
            {},
            function (err) {
              if (err) {
                return apiResponse.ErrorResponse(res, err);
              } else {
                return apiResponse.successResponse(
                  res,
                  "Category delete Success."
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
