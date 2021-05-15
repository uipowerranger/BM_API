const CategoryModel = require("../models/SubCategoryModel");
const AllCategoryModel = require("../models/CategoryModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Category Schema
function CategoryData(data) {
  this.id = data._id;
  this.sub_category_name = data.sub_category_name;
  this.category = data.category;
  this.createdAt = data.createdAt;
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
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $project: {
            sub_category_name: 1,
            category: 1,
            createdAt: 1,
            status: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_category.state_details": 1,
          },
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

exports.CategoryListById = [
  function (req, res) {
    try {
      CategoryModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $match: {
            category: mongoose.Types.ObjectId(req.params.id),
          },
        },
        {
          $project: {
            sub_category_name: 1,
            category: 1,
            createdAt: 1,
            status: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_category.state_details": 1,
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
 * @param {string}      sub_category_name
 *
 * @returns {Object}
 */
exports.CategoryStore = [
  auth,
  body("sub_category_name", "Name must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape()
    .custom((value, { req }) => {
      return CategoryModel.findOne({
        sub_category_name: value,
        status: { $ne: 3 },
      }).then((cat) => {
        if (cat) {
          return Promise.reject("Category already exist with this name.");
        }
      });
    }),
  body("category", "Category must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return AllCategoryModel.findOne({ _id: value }).then((cat) => {
        if (!cat) {
          return Promise.reject("Enter valid category ID");
        }
      });
    }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new CategoryModel({
        sub_category_name: req.body.sub_category_name,
        category: req.body.category,
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
  body("sub_category_name", "Name must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("status", "Status must not be empty.").isLength({ min: 1 }).trim(),
  body("category", "Category must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return AllCategoryModel.findOne({ _id: value }).then((cat) => {
        if (!cat) {
          return Promise.reject("Enter valid category ID");
        }
      });
    }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new CategoryModel({
        sub_category_name: req.body.sub_category_name,
        category: req.body.category,
        status: req.body.status,
        _id: req.params.id,
      });
      console.log(category);
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
