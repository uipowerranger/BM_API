const UnitModel = require("../models/UnitModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

exports.UnitList = [
  (req, res) => {
    try {
      UnitModel.find({ status: { $ne: 2 } })
        .then((data) => {
          return apiResponse.successResponseWithData(res, "Success", data);
        })
        .catch((err) => {
          return apiResponse.ErrorResponse(res, err);
        });
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];

exports.UnitStore = [
  auth,
  body("unit_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Unit name must be specified.")
    .custom((value) => {
      return UnitModel.findOne({ unit_name: value, status: { $ne: 3 } }).then(
        (cat) => {
          if (cat) {
            return Promise.reject("Unit name already exists");
          }
        }
      );
    }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        let Unit = new UnitModel({
          unit_name: req.body.unit_name,
          status: 1,
        });
        Unit.save((err, data) => {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          } else {
            return apiResponse.successResponseWithData(res, "Success", data);
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];

exports.UnitUpdate = [
  auth,
  body("status").isLength({ min: 1 }).withMessage("Status must be specified."),
  body("unit_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Unit name must be specified."),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Invalid Id",
          "Invalid Data Id"
        );
      } else {
        UnitModel.findByIdAndUpdate(
          req.params.id,
          {
            unit_name: req.body.unit_name,
            status: req.body.status,
          },
          { new: true }
        ).then((data) => {
          if (!data) {
            return apiResponse.ErrorResponse(res, "Error Update");
          } else {
            return apiResponse.successResponseWithData(res, "Success", data);
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];

exports.UnitDelete = [
  auth,
  (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Invalid Id",
          "Invalid Data Id"
        );
      } else {
        UnitModel.findByIdAndDelete(req.params.id, {}).then((data) => {
          if (!data) {
            return apiResponse.ErrorResponse(res, "Error Delete");
          } else {
            return apiResponse.successResponse(res, "Success");
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];
