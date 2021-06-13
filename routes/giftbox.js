var express = require("express");
const GiftBoxController = require("../controllers/GiftBoxController");

var router = express.Router();

router.post("/create", GiftBoxController.create);
router.get("/", GiftBoxController.list);
router.delete("/:id", GiftBoxController.delete);

module.exports = router;
