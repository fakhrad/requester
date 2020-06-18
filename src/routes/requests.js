var express = require("express");
var router = express.Router();
var controller = require("../controllers/requestController");
var auth = require("../controllers/auth");

router.get("/allnew", auth.verifyToken, controller.getNewapplications);
router.get("/opened", auth.verifyToken, controller.getOpenedApplications);
router.put("/open/:id", auth.verifyToken, controller.openApplication);
router.put("/cancel/:id", auth.verifyToken, controller.cancelApplication);
router.put("/reject/:id", auth.verifyToken, controller.rejectApplication);
router.post("/submit", auth.verifyToken, controller.submit);
router.get("/myrequests", auth.verifyToken, controller.myRequests);
router.get("/myrequests/lean", auth.verifyToken, controller.myRequestsLean);
router.get("/all", auth.verifyToken, controller.userRequests);
router.get("/offers/all", auth.verifyToken, controller.getRequestsOffers);
module.exports = router;