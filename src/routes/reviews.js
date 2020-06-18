var express = require("express");

var router = express.Router();
var controller = require("../controllers/reviewcontroller");
var auth = require("../controllers/auth");

router.post("/add", auth.verifyToken, controller.add);
router.put("/update", auth.verifyToken, controller.update);
router.delete("/remove", auth.verifyToken, controller.remove);
router.get("/", auth.verifyToken, controller.getreviewslist);
module.exports = router;