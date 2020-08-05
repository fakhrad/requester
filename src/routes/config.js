var express = require("express");
var router = express.Router();
var auth = require("../controllers/auth");
var controller = require("../controllers/configController");
router.get("/locales", auth.verifyToken, controller.getlocales);
module.exports = router;
