var express = require("express");
var cors = require("cors");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var helmet = require("helmet");
var compression = require("compression");

var app = express();

app.use(compression()); //Compress all routes
app.use(helmet());
app.use(cors());

var customer = require("./routes/customers");
var lists = require("./routes/lists");
var auth = require("./routes/auth");
var quotes = require("./routes/quotes");
var quotes_v2 = require("./routes/quotes_v2");
var request = require("./routes/requests");
var request_v2 = require("./routes/requests_v2");
var partner = require("./routes/partners");
var products = require("./routes/products");
var reviews = require("./routes/reviews");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use("/api/v1/customers", customer);
app.use("/api/v1/quotes", quotes);
app.use("/api/v2/quotes", quotes_v2);
app.use("/api/v1/requests", request);
app.use("/api/v2/requests", request_v2);
app.use("/api/v1/lists", lists);
app.use("/api/v1/auth", auth);
app.use("/api/v1/products", products);
app.use("/api/v1/partners", partner);
app.use("/api/v1/reviews", reviews);
app.use("/docs", express.static("./apidoc"));
module.exports = app;