var express = require("express");

var router = express.Router();
var controller = require("../controllers/contactsController");
var auth = require("../controllers/auth");

router.post("/", auth.verifyToken, controller.add);
module.exports = router;