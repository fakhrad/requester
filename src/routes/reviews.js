var express = require("express");

var router = express.Router();
var controller = require("../controllers/reviewcontroller");
var auth = require("../controllers/auth");

router.post("/", auth.verifyToken, controller.add);
router.put("/", auth.verifyToken, controller.update);
router.delete("/", auth.verifyToken, controller.remove);
router.get("/:id", auth.verifyToken, controller.getreviewslist);
module.exports = router;