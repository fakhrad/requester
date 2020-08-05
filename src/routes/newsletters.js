var express = require("express");

var router = express.Router();
var controller = require("../controllers/newslettersController");
var auth = require("../controllers/auth");

router.post("/subscribe", auth.verifyToken, controller.add);
module.exports = router;