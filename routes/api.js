var express = require("express");
var authRouter = require("./auth");
var adminRouter = require("./admin");
var categoryRouter = require("./category");
var subCategoryRouter = require("./subcategory");
var stateRouter = require("./state");
var postcodeRouter = require("./postcode");
var productsRouter = require("./products");
var userRouter = require("./user");
var orderRouter = require("./order");
var checkoutRouter = require("./checkout");
var clientRouter = require("./client");
var wishlistRouter = require("./wishlist");
var enquiryRouter = require("./enquiry");
var redeemRouter = require("./redeem");
var stockRouter = require("./stock");
var carouselRouter = require("./carousel");
var unitsRouter = require("./units");
var filterRouter = require("./filters");

var app = express();

app.use("/auth/", authRouter);
app.use("/admin/", adminRouter);
app.use("/category/", categoryRouter);
app.use("/subcategory/", subCategoryRouter);
app.use("/state", stateRouter);
app.use("/postcode", postcodeRouter);
app.use("/products", productsRouter);
app.use("/user", userRouter);
app.use("/order", orderRouter);
app.use("/checkout", checkoutRouter);
app.use("/client", clientRouter);
app.use("/wishlist", wishlistRouter);
app.use("/enquiry", enquiryRouter);
app.use("/redeem", redeemRouter);
app.use("/stock", stockRouter);
app.use("/carousel", carouselRouter);
app.use("/units", unitsRouter);
app.use("/filters", filterRouter);

module.exports = app;
