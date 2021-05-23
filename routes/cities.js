var express = require("express");
const CitiesController = require("../controllers/CitiesController");

var router = express.Router();

router.get("/bystate/:state_id", CitiesController.CityListByState);
router.post("/", CitiesController.CityStore);

module.exports = router;
