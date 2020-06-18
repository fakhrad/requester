var express = require("express");
var router = express.Router();
var controller = require("../controllers/listController");
var auth = require("../controllers/auth");
/**
 * @api {get} /cities/api/v1/getall Get cities
 * @apiName GetCities
 * @apiGroup City
 *
 *
 * @apiSuccessExample Success Response 
HTTP/1.1 200 OK
{
[
    {
        "_id": "5c24cee9fb6fc00eee871c09",
        "cityCode": "1",
        "name": {
            "fa": "تهران",
            "en": "Tehran"
        }
    },
    {
        "_id": "5c24cf3dfb6fc00eee871d07",
        "cityCode": "2",
        "name": {
            "fa": "اصفهان",
            "en": "Isfahan"
        }
    }
]
}
 *
* @apiErrorExample Servr Error
HTTP/1.1 500 Internal server error
 {
    "success": false,
    "error" : {
       //error details
    }
 }

 */
router.get("/:contentType", auth.verifyToken, controller.getcontentsbytype);
router.get("/get/query", auth.verifyToken, controller.querycontents);
router.get("/getall/:contentType/lean", auth.verifyToken, controller.getAllLean);
router.get("/getall/:contentType", auth.verifyToken, controller.getAll);
router.get("/get/fullquery", auth.verifyToken, controller.fullquery);
router.get("/lean/:contentType", auth.verifyToken, controller.getflatcontentsbytype);
router.post("/search", auth.verifyToken, controller.search);
module.exports = router;