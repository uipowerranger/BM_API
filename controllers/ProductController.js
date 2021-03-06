const ProductModel = require("../models/ProductModel");
const StockMoveModel = require("../models/StockMoveModel");
const AllCategoryModel = require("../models/CategoryModel");
const AllStateModel = require("../models/StateModel");
const FilterModel = require("../models/FiltersModel");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const moment = require("moment");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Category Schema
function ProductData(data) {
  this._id = data._id;
  this.category_details = data.category_details;
  this.item_name = data.item_name;
  this.items_available = data.items_available;
  this.post_code_details = data.post_code_details;
  this.price = data.price;
  this.actualPrice = data.actualPrice;
  this.state_details = data.state_details;
  this.sub_category_details = data.sub_category_details;
  this.weight = data.weight;
  this.offer_from_date = data.offer_from_date;
  this.offer_to_date = data.offer_to_date;
  this.deal_details = data.deal_details;
  this.offer_details = data.offer_details;
  this.has_deal = data.has_deal;
  this.has_offer = data.has_offer;
  this.home_page_display = data.home_page_display;
  this.image = data.image;
  this.createdAt = data.createdAt;
}

/**
 * By State
 */

exports.ProductListByState = [
  function (req, res) {
    try {
      ProductModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category_details",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $lookup: {
            from: "sub_categories",
            localField: "sub_category_details",
            foreignField: "_id",
            as: "map_sub_category",
          },
        },
        {
          $unwind: "$map_sub_category",
        },
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
            as: "map_postcode",
          },
        },
        {
          $unwind: "$map_postcode",
        },
        {
          $lookup: {
            from: "stockmovements",
            localField: "_id",
            foreignField: "item_id",
            as: "stockmovements",
          },
        },
        {
          $match: {
            state_details: mongoose.Types.ObjectId(req.params.id),
          },
        },
        {
          $project: {
            offer_from_date: 1,
            offer_to_date: 1,
            price: 1,
            deal_details: 1,
            offer_details: 1,
            has_deal: 1,
            has_offer: 1,
            home_page_display: 1,
            status: 1,
            user: 1,
            item_name: 1,
            category_details: 1,
            image: 1,
            post_code_details: 1,
            state_details: 1,
            sub_category_details: 1,
            weight: 1,
            units: 1,
            actualPrice: 1,
            description: 1,
            homepage_filter: 1,
            createdAt: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_sub_category._id": 1,
            "map_sub_category.sub_category_name": 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
            "map_postcode._id": 1,
            "map_postcode.post_code": 1,
            stockmovements: 1,
          },
        },
      ]).then(async (products) => {
        if (products.length > 0) {
          let filters = await new Promise((resolve, reject) => {
            FilterModel.find({ status: 1 })
              .then((res) => resolve(res))
              .catch((e) => reject([]));
          });
          let filterList = filters.map((p) => {
            return {
              name: p.filter_name,
              prod_list: [],
            };
          });
          products.map((prod) => {
            let totalStock = 0;
            prod.stockmovements.map((st) => {
              if (st.status === 2) {
                totalStock = totalStock + st.quantity;
              } else {
                totalStock = totalStock - st.quantity;
              }
            });
            delete prod.stockmovements;
            let i = filterList.findIndex(
              (f) => f.name === prod.homepage_filter
            );
            let fIndex = i;
            if (fIndex !== -1) {
              filterList[fIndex].prod_list.push({
                ...prod,
                items_available: totalStock,
              });
            }
            return {
              ...prod,
              items_available: totalStock,
            };
          });
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            filterList.filter((d) => d.prod_list.length > 0)
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

exports.ProductListSearchByState = [
  body("state_id", "State Id must be required").isLength({ min: 1 }).trim(),
  body("search_string", "Search must be minimum 3 characters")
    .isLength({ min: 3 })
    .trim(),
  function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const rgx = (pattern) => new RegExp(`.*${pattern}.*`);
        const searchRgx = rgx(req.body.search_string);
        ProductModel.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "category_details",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: "$category",
          },
          {
            $match: {
              state_details: mongoose.Types.ObjectId(req.body.state_id),
              item_name: { $regex: searchRgx, $options: "i" },
            },
          },
          {
            $project: {
              offer_from_date: 1,
              offer_to_date: 1,
              price: 1,
              deal_details: 1,
              offer_details: 1,
              has_deal: 1,
              has_offer: 1,
              home_page_display: 1,
              status: 1,
              user: 1,
              item_name: 1,
              category_details: 1,
              image: 1,
              post_code_details: 1,
              state_details: 1,
              sub_category_details: 1,
              weight: 1,
              units: 1,
              actualPrice: 1,
              description: 1,
              homepage_filter: 1,
              createdAt: 1,
              "category._id": 1,
              "category.category_name": 1,
            },
          },
        ]).then((products) => {
          if (products.length > 0) {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              products
            );
          } else {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              []
            );
          }
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.ProductListSearchByStateandCategory = [
  body("state_id", "State Id must be required").isLength({ min: 1 }).trim(),
  body("category_id", "Category Id must be required")
    .isLength({ min: 3 })
    .trim(),
  function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        ProductModel.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "category_details",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: "$category",
          },
          {
            $lookup: {
              from: "stockmovements",
              localField: "_id",
              foreignField: "item_id",
              as: "stockmovements",
            },
          },
          {
            $match: {
              state_details: mongoose.Types.ObjectId(req.body.state_id),
              category_details: mongoose.Types.ObjectId(req.body.category_id),
            },
          },
          {
            $project: {
              offer_from_date: 1,
              offer_to_date: 1,
              price: 1,
              deal_details: 1,
              offer_details: 1,
              has_deal: 1,
              has_offer: 1,
              home_page_display: 1,
              status: 1,
              user: 1,
              item_name: 1,
              category_details: 1,
              image: 1,
              post_code_details: 1,
              state_details: 1,
              sub_category_details: 1,
              weight: 1,
              units: 1,
              actualPrice: 1,
              description: 1,
              homepage_filter: 1,
              createdAt: 1,
              "category._id": 1,
              "category.category_name": 1,
              stockmovements: 1,
            },
          },
        ]).then((products) => {
          if (products.length > 0) {
            let data = products.map((prod) => {
              let totalStock = 0;
              prod.stockmovements.map((st) => {
                if (st.status === 2) {
                  totalStock = totalStock + st.quantity;
                } else {
                  totalStock = totalStock - st.quantity;
                }
              });
              delete prod.stockmovements;
              return {
                ...prod,
                items_available: totalStock,
              };
            });
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              data
            );
          } else {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              []
            );
          }
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Product List.
 *
 * @returns {Object}
 */
exports.ProductList = [
  function (req, res) {
    try {
      ProductModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category_details",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $lookup: {
            from: "sub_categories",
            localField: "sub_category_details",
            foreignField: "_id",
            as: "map_sub_category",
          },
        },
        {
          $unwind: "$map_sub_category",
        },
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
            as: "map_postcode",
          },
        },
        {
          $unwind: "$map_postcode",
        },
        {
          $lookup: {
            from: "stockmovements",
            localField: "_id",
            foreignField: "item_id",
            as: "stockmovements",
          },
        },
        // {
        //   $match: {
        //     status: { $ne: 3 },
        //   },
        // },
        {
          $project: {
            offer_from_date: 1,
            offer_to_date: 1,
            price: 1,
            deal_details: 1,
            offer_details: 1,
            has_deal: 1,
            has_offer: 1,
            home_page_display: 1,
            status: 1,
            user: 1,
            item_name: 1,
            category_details: 1,
            image: 1,
            post_code_details: 1,
            state_details: 1,
            sub_category_details: 1,
            weight: 1,
            units: 1,
            actualPrice: 1,
            description: 1,
            homepage_filter: 1,
            createdAt: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_sub_category._id": 1,
            "map_sub_category.sub_category_name": 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
            "map_postcode._id": 1,
            "map_postcode.post_code": 1,
            stockmovements: 1,
          },
        },
      ]).then((products) => {
        if (products.length > 0) {
          let data = products.map((prod) => {
            let totalStock = 0;
            prod.stockmovements.map((st) => {
              if (st.status === 2) {
                totalStock = totalStock + st.quantity;
              } else {
                totalStock = totalStock - st.quantity;
              }
            });
            delete prod.stockmovements;
            return {
              ...prod,
              items_available: totalStock,
            };
          });
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            data
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
 * All Products
 */

exports.AllProductList = [
  function (req, res) {
    try {
      ProductModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category_details",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $lookup: {
            from: "sub_categories",
            localField: "sub_category_details",
            foreignField: "_id",
            as: "map_sub_category",
          },
        },
        {
          $unwind: "$map_sub_category",
        },
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
            as: "map_postcode",
          },
        },
        {
          $unwind: "$map_postcode",
        },
        {
          $lookup: {
            from: "stockmovements",
            localField: "_id",
            foreignField: "item_id",
            as: "stockmovements",
          },
        },
        {
          $match: {
            status: {
              $ne: 3,
            },
          },
        },
        {
          $project: {
            offer_from_date: 1,
            offer_to_date: 1,
            price: 1,
            deal_details: 1,
            offer_details: 1,
            has_deal: 1,
            has_offer: 1,
            home_page_display: 1,
            status: 1,
            user: 1,
            item_name: 1,
            category_details: 1,
            image: 1,
            post_code_details: 1,
            state_details: 1,
            sub_category_details: 1,
            weight: 1,
            units: 1,
            actualPrice: 1,
            description: 1,
            homepage_filter: 1,
            createdAt: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_sub_category._id": 1,
            "map_sub_category.sub_category_name": 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
            "map_postcode._id": 1,
            "map_postcode.post_code": 1,
            stockmovements: 1,
          },
        },
      ]).then(async (products) => {
        if (products.length > 0) {
          let filters = await new Promise((resolve, reject) => {
            FilterModel.find({ status: 1 })
              .then((res) => resolve(res))
              .catch((e) => reject([]));
          });
          let filterList = filters.map((p) => {
            return {
              name: p.filter_name,
              prod_list: [],
            };
          });
          products.map((prod) => {
            let totalStock = 0;
            prod.stockmovements.map((st) => {
              if (st.status === 2) {
                totalStock = totalStock + st.quantity;
              } else {
                totalStock = totalStock - st.quantity;
              }
            });
            delete prod.stockmovements;
            let i = filterList.findIndex(
              (f) => f.name === prod.homepage_filter
            );
            let fIndex = i;
            if (fIndex !== -1) {
              filterList[fIndex].prod_list.push({
                ...prod,
                items_available: totalStock,
              });
            }
            return {
              ...prod,
              items_available: totalStock,
            };
          });
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            filterList.filter((d) => d.prod_list.length > 0)
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
 * Products By Category
 */

exports.ProductListByCategory = [
  (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return apiResponse.validationErrorWithData(
          res,
          "Invalid Id",
          "Invalid Category Id"
        );
      }
      ProductModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category_details",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $lookup: {
            from: "sub_categories",
            localField: "sub_category_details",
            foreignField: "_id",
            as: "map_sub_category",
          },
        },
        {
          $unwind: "$map_sub_category",
        },
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
            as: "map_postcode",
          },
        },
        {
          $unwind: "$map_postcode",
        },
        {
          $lookup: {
            from: "stockmovements",
            localField: "_id",
            foreignField: "item_id",
            as: "stockmovements",
          },
        },
        {
          $match: {
            category_details: {
              $eq: mongoose.Types.ObjectId(req.params.id),
            },
          },
        },
        {
          $project: {
            offer_from_date: 1,
            offer_to_date: 1,
            price: 1,
            deal_details: 1,
            offer_details: 1,
            has_deal: 1,
            has_offer: 1,
            home_page_display: 1,
            status: 1,
            user: 1,
            item_name: 1,
            category_details: 1,
            image: 1,
            post_code_details: 1,
            state_details: 1,
            sub_category_details: 1,
            weight: 1,
            units: 1,
            actualPrice: 1,
            description: 1,
            homepage_filter: 1,
            createdAt: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_sub_category._id": 1,
            "map_sub_category.sub_category_name": 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
            "map_postcode._id": 1,
            "map_postcode.post_code": 1,
            stockmovements: 1,
          },
        },
      ]).then((products) => {
        if (products.length > 0) {
          let data = products.map((prod) => {
            let totalStock = 0;
            prod.stockmovements.map((st) => {
              if (st.status === 2) {
                totalStock = totalStock + st.quantity;
              } else {
                totalStock = totalStock - st.quantity;
              }
            });
            delete prod.stockmovements;
            return {
              ...prod,
              items_available: totalStock,
            };
          });
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            data
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
 * Products by Sub category
 */

exports.ProductListBySubCategory = [
  function (req, res) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return apiResponse.validationErrorWithData(
          res,
          "Invalid Id",
          "Invalid Sub Category Id"
        );
      }
      ProductModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category_details",
            foreignField: "_id",
            as: "map_category",
          },
        },
        {
          $unwind: "$map_category",
        },
        {
          $lookup: {
            from: "sub_categories",
            localField: "sub_category_details",
            foreignField: "_id",
            as: "map_sub_category",
          },
        },
        {
          $unwind: "$map_sub_category",
        },
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
            as: "map_postcode",
          },
        },
        {
          $unwind: "$map_postcode",
        },
        {
          $lookup: {
            from: "stockmovements",
            localField: "_id",
            foreignField: "item_id",
            as: "stockmovements",
          },
        },
        {
          $match: {
            sub_category_details: {
              $eq: mongoose.Types.ObjectId(req.params.id),
            },
          },
        },

        {
          $project: {
            offer_from_date: 1,
            offer_to_date: 1,
            price: 1,
            deal_details: 1,
            offer_details: 1,
            has_deal: 1,
            has_offer: 1,
            home_page_display: 1,
            status: 1,
            user: 1,
            item_name: 1,
            category_details: 1,
            image: 1,
            post_code_details: 1,
            state_details: 1,
            sub_category_details: 1,
            weight: 1,
            units: 1,
            actualPrice: 1,
            description: 1,
            homepage_filter: 1,
            createdAt: 1,
            "map_category._id": 1,
            "map_category.category_name": 1,
            "map_sub_category._id": 1,
            "map_sub_category.sub_category_name": 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
            "map_postcode._id": 1,
            "map_postcode.post_code": 1,
            stockmovements: 1,
          },
        },
      ]).then((products) => {
        if (products.length > 0) {
          let data = products.map((prod) => {
            let totalStock = 0;
            prod.stockmovements.map((st) => {
              if (st.status === 2) {
                totalStock = totalStock + st.quantity;
              } else {
                totalStock = totalStock - st.quantity;
              }
            });
            delete prod.stockmovements;
            return {
              ...prod,
              items_available: totalStock,
            };
          });
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            data
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
 * Product store.
 *
 * @param {string}      category_name
 *
 * @returns {Object}
 */
exports.ProductStore = [
  auth,
  body("item_name", "Name must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape(),
  body("price", "Price must not be empty.")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 characters.")
    .trim(),
  body("actualPrice", "Actual Price must not be empty.")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 characters.")
    .trim(),
  body("weight", "Weight must not be empty.")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 characters.")
    .trim(),
  body("items_available", "Items vailable must not be empty.")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 characters.")
    .trim(),
  body("category_details", "Category must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return AllCategoryModel.findOne({ _id: value }).then((cat) => {
        if (!cat) {
          return Promise.reject("Enter valid category ID");
        }
      });
    }),
  body("sub_category_details", "Sub Category must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape(),
  body("state_details", "State must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return AllStateModel.findOne({ _id: value }).then((cat) => {
        if (!cat) {
          return Promise.reject("Enter valid State ID");
        }
      });
    }),
  body("post_code_details", "Post Code must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape(),
  body("units", "Units must not be empty.")
    .isLength({ min: 1 })
    .withMessage("Minimum 1 characters."),
  (req, res) => {
    try {
      const errors = validationResult(req);
      const { _id, ...rest } = req.body;
      var product = new ProductModel({
        user: req.user,
        ...rest,
      });
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        //Save Product.
        product.save(function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          let Product_Data = new ProductData(product);
          let stock = new StockMoveModel({
            date: new Date(),
            user: req.user._id,
            order_id: mongoose.Types.ObjectId(),
            item_id: Product_Data._id,
            quantity: Product_Data.items_available,
            status: 2,
            transactionType: "By Create",
          });
          stock.save((err, msg) => { });
          return apiResponse.successResponseWithData(
            res,
            "Product add Success.",
            Product_Data
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
 * Product update.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.ProductUpdate = [
  auth,
  body("item_name", "Name must not be empty.").isLength({ min: 1 }).trim(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var product = new ProductModel({
        ...req.body,
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
          ProductModel.findById(req.params.id, function (err, foundProduct) {
            if (foundProduct === null) {
              return apiResponse.notFoundResponse(
                res,
                "Product not exists with this id"
              );
            } else {
              //update Category.
              ProductModel.findByIdAndUpdate(
                req.params.id,
                product,
                {},
                function (err) {
                  if (err) {
                    return apiResponse.ErrorResponse(res, err);
                  } else {
                    let product_data = new ProductData(product);
                    return apiResponse.successResponseWithData(
                      res,
                      "Product update Success.",
                      product_data
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
 * Product Delete.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.ProductDelete = [
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
      ProductModel.findById(req.params.id, function (err, foundProduct) {
        if (foundProduct === null) {
          return apiResponse.notFoundResponse(
            res,
            "Product not exists with this id"
          );
        } else {
          //delete Product.
          ProductModel.findByIdAndUpdate(
            req.params.id,
            { status: req.params.status },
            function (err) {
              if (err) {
                return apiResponse.ErrorResponse(res, err);
              } else {
                return apiResponse.successResponse(
                  res,
                  "Product status update Success."
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
