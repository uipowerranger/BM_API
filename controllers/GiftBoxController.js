const GiftBoxModel = require( "../models/GiftBoxModel" );

const StateModel = require( "../models/StateModel" );
const { body, validationResult } = require( "express-validator" );
//helper file to prepare responses.
const apiResponse = require( "../helpers/apiResponse" );
const utility = require( "../helpers/utility" );
const jwt = require( "jsonwebtoken" );
const auth = require( "../middlewares/jwt" );
var mongoose = require( "mongoose" );

// Default export is a4 paper, portrait, using millimeters for units

mongoose.set( "useFindAndModify", false );

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
  body( "state_id", "State Id must not be empty......" )
    .isLength( { min: 1 } )
    .trim()
    .custom( ( value, { req } ) => {
      return StateModel.findOne( { _id: value } ).then( ( cat ) => {
        if ( !cat ) {
          return Promise.reject( "Enter valid state ID" );
        }
      } );
    } ),
  body( "state_name", "State Name must not be empty......" )
    .exists()
    .isLength( { min: 1 } )
    .isString(),
  body( "box_name", "Box name is required" )
    .exists()
    .isLength( { min: 1 } )
    .isString(),
  body( "items" )
    .isLength( { min: 1 } )
    .withMessage( "Items cannot be empty" )
    .isArray()
    .withMessage( "Items must be Array of objects." ),
  body( "items.*.item_id", "Item_id must be a string" )
    .exists()
    .isLength( { min: 1 } )
    .isString(),
  body( "items.*.item_name", "Item name must be a string" )
    .exists()
    .isLength( { min: 1 } )
    .isString(),
  body( "items.*.item_image", "Item image must be a string" )
    .exists()
    .isLength( { min: 1 } )
    .isString(),
  body( "items.*.quantity", "Quantity must be a number" )
    .exists()
    .isLength( { min: 1 } )
    .isInt(),
  body( "items.*.price", "Price must be a Decimal" )
    .exists()
    .isLength( { min: 1 } )
    .isDecimal(),
  body( "items.*.amount", "Amount must be a Decimal" )
    .exists()
    .isLength( { min: 1 } )
    .isDecimal(),
  body( "items.*.mandatefield", "Please select One" )
    .exists()
    .isLength( { min: 1 } )
    .isBoolean(),
  body( "total_amount", "Total must be a Decimal" )
    .exists()
    .isLength( { min: 1 } )
    .isDecimal(),
  function ( req, res ) {
    try {
      const errors = validationResult( req );
      if ( !errors.isEmpty() ) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { _id, ...rest } = req.body;
        var order = new GiftBoxModel( {
          state: req.body.state_id,
          state_name: req.body.state_name,
          user: req.user._id,
          ...rest,
        } );
        // Save order.

        order.save( function ( err ) {
          if ( err ) {
            return apiResponse.ErrorResponse( res, err );
          } else {
            return apiResponse.successResponse( res, "Giftbox Created" );
          }
        } );
      }
    } catch ( err ) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse( res, err );
    }
  }
]
exports.list = [
  function ( req, res ) {
    try {
      GiftBoxModel.find( { status: { $eq: 1 } } ).then( ( orders ) => {
        if ( orders.length > 0 ) {

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
      } );
    } catch ( err ) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse( res, err );
    }
  },
];

exports.delete = [
  auth,
  function ( req, res ) {
    try {
      if ( !mongoose.Types.ObjectId.isValid( req.params.id ) ) {
        return apiResponse.ErrorResponse( res, "Invalid ID" );
      }
      GiftBoxModel.findByIdAndDelete( req.params.id ).then( ( orders ) => {
        if ( orders ) {
          return apiResponse.successResponse( res, "Operation success" );
        } else {
          return apiResponse.ErrorResponse( res, "Id not found" );
        }
      } );
    } catch ( err ) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse( res, err );
    }
  },
];
