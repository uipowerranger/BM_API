const PostcodeModel = require( "../models/PostcodeModel" );
const StateModel = require( "../models/StateModel" );
const { body, validationResult } = require( "express-validator" );
const apiResponse = require( "../helpers/apiResponse" );
const auth = require( "../middlewares/jwt" );
var mongoose = require( "mongoose" );
mongoose.set( "useFindAndModify", false );

// Category Schema
function PostcodeData ( data ) {
  this.id = data._id;
  this.post_code = data.post_code;
  this.state = data.state;
  this.createdAt = data.createdAt;
}

/**
 * Category List.
 *
 * @returns {Object}
 */
exports.PostcodeList = [
  function ( req, res ) {
    try {
      PostcodeModel.aggregate( [
        {
          $lookup: {
            from: "states",
            localField: "state",
            foreignField: "_id",
            as: "map_state",
          },
        },
        {
          $unwind: "$map_state",
        },
        {
          $project: {
            post_code: 1,
            state: 1,
            createdAt: 1,
            status: 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
          },
        },
        { $match: { status: { $ne: 3 } } },
      ] ).then( ( postcodes ) => {
        if ( postcodes.length > 0 ) {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            postcodes
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

exports.PostcodeListById = [
  function ( req, res ) {
    try {
      PostcodeModel.aggregate( [
        {
          $lookup: {
            from: "states",
            localField: "state",
            foreignField: "_id",
            as: "map_state",
          },
        },
        {
          $unwind: "$map_state",
        },
        {
          $match: {
            state: mongoose.Types.ObjectId( req.params.id ),
          },
        },
        {
          $project: {
            post_code: 1,
            state: 1,
            createdAt: 1,
            status: 1,
            "map_state._id": 1,
            "map_state.state_name": 1,
          },
        },
      ] ).then( ( postcodes ) => {
        if ( postcodes.length > 0 ) {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            postcodes
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

/**
 * Category store.
 *
 * @param {string}      post_code
 *
 * @returns {Object}
 */
exports.PostcodeStore = [
  auth,
  body( "post_code", "Postcode must not be empty." )
    .isLength( { min: 3 } )
    .withMessage( "Minimum 3 characters." )
    .trim()
    .escape()
    .custom( ( value, { req } ) => {
      return PostcodeModel.findOne( {
        post_code: value,
        status: { $ne: 3 },
      } ).then( ( cat ) => {
        if ( cat ) {
          return Promise.reject( "Postcode already exist." );
        }
      } );
    } ),
  body( "state", "State must not be empty" )
    .isLength( { min: 1 } )
    .trim()
    .custom( ( value, { req } ) => {
      return StateModel.findOne( { _id: value } ).then( ( cat ) => {
        if ( !cat ) {
          return Promise.reject( "Enter valid state ID" );
        }
      } );
    } ),
  ( req, res ) => {
    try {
      const errors = validationResult( req );
      var postcode = new PostcodeModel( {
        post_code: req.body.post_code,
        state: req.body.state,
      } );

      if ( !errors.isEmpty() ) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        //Save postcode.
        postcode.save( function ( err ) {
          if ( err ) {
            return apiResponse.ErrorResponse( res, err );
          }
          let data = new PostcodeData( postcode );
          return apiResponse.successResponseWithData(
            res,
            "Postcode add Success.",
            data
          );
        } );
      }
    } catch ( err ) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse( res, err );
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
exports.PostcodeUpdate = [
  auth,
  body( "post_code", "Postcode must not be empty." ).isLength( { min: 1 } ).trim(),
  body( "state", "State must not be empty" )
    .isLength( { min: 1 } )
    .trim()
    .custom( ( value, { req } ) => {
      return StateModel.findOne( { _id: value } ).then( ( cat ) => {
        if ( !cat ) {
          return Promise.reject( "Enter valid state ID" );
        }
      } );
    } ),
  ( req, res ) => {
    try {
      const errors = validationResult( req );
      var category = new PostcodeModel( {
        post_code: req.body.post_code,
        state: req.body.state,
        status: req.body.status,
        _id: req.params.id,
      } );

      if ( !errors.isEmpty() ) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        if ( !mongoose.Types.ObjectId.isValid( req.params.id ) ) {
          return apiResponse.validationErrorWithData(
            res,
            "Invalid Error.",
            "Invalid ID"
          );
        } else {
          PostcodeModel.findById( req.params.id, function ( err, foundCategory ) {
            if ( foundCategory === null ) {
              return apiResponse.notFoundResponse(
                res,
                "Postcode not exists with this id"
              );
            } else {
              //update Category.
              PostcodeModel.findByIdAndUpdate(
                req.params.id,
                category,
                {},
                function ( err ) {
                  if ( err ) {
                    return apiResponse.ErrorResponse( res, err );
                  } else {
                    let Category_Data = new PostcodeData( category );
                    return apiResponse.successResponseWithData(
                      res,
                      "Postcode update Success.",
                      Category_Data
                    );
                  }
                }
              );
            }
          } );
        }
      }
    } catch ( err ) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse( res, err );
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
exports.PostcodeDelete = [
  auth,
  function ( req, res ) {
    if ( !mongoose.Types.ObjectId.isValid( req.params.id ) ) {
      return apiResponse.validationErrorWithData(
        res,
        "Invalid Error.",
        "Invalid ID"
      );
    }
    try {
      PostcodeModel.findById( req.params.id, function ( err, foundCategory ) {
        if ( foundCategory === null ) {
          return apiResponse.notFoundResponse(
            res,
            "Postcode not exists with this id"
          );
        } else {
          //delete Category.
          PostcodeModel.findByIdAndUpdate(
            req.params.id,
            { status: 3 },
            {},
            function ( err ) {
              if ( err ) {
                return apiResponse.ErrorResponse( res, err );
              } else {
                return apiResponse.successResponse(
                  res,
                  "Postcode delete Success."
                );
              }
            }
          );
        }
      } );
    } catch ( err ) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse( res, err );
    }
  },
];
