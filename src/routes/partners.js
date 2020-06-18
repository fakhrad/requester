var express = require("express");

var router = express.Router();
var usercontoller = require("../controllers/partnerController");
var auth = require("../controllers/auth");

/**
 * @api {post} /user/requestcode Request code
 * @apiName Request activation code for a phonenumber
 * @apiGroup User
 *
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiHeaderExample {String} Authorization
 * { 
 *    "Authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjMWQ2YzdiNzk3YThmMTQ4MjUxYzZiZSIsInBob25lTnVtYmVyIjoiMDkxOTc2ODIzODYiLCJpYXQiOjE1NDU2NTAxNjksImV4cCI6MTU0NTczNjU2OX0.32Vaz9Zo_g0wD1klKOTzb1VGMy9JusV3dZgTJTyLJ7I"
 * }
 * @apiParam {String} phonenumber New phone number
 *
 * @apiSuccessExample Success Response 
HTTP/1.1 200 OK
{
    "activation_code" : 1243
}
 *
  * @apiErrorExample UnAuthorized
  HTTP/1.1 401 UnAuthorized access
 {
    "success": false,
    "error" : {
       //error details
    }
 }
* @apiErrorExample Servr Error
HTTP/1.1 500 Internal server error
 {
    "success": false,
    "error" : {
       //error details
    }
 }

 */
router.post("/requestcode", auth.verifyToken, usercontoller.requestcode);
/**
 * @api {post} /user/verifycode VerifyCode
 * @apiName Verify Code
 * @apiGroup User
 *
 * @apiParam {String} phoneNumber User unique phone number 
 * @apiParam {String} code activation code
 *
 * @apiSuccessExample Success Response 
 HTTP/1.1 200 OK
{
    "roles": [
        "user"
    ],
    "_id": "5c2161acdfa08f285c33c44c",
    "phoneNumber": "09388475257",
    "first_name": "Saeed",
    "last_name": "Padyab olsun",
    "city_code": 1,
    "__v": 0,
    "address": "no.41, Block 23, Bosphorous city, 221 Sokak, Kucukcekmace, Istanbul, Turkey",
    "location": {
        "lat": 34.65,
        "long": 54.56
    },
    "avatar": "/docs/img/uploads/avatar-1546717703454.jpeg",
    "notification": true,
    "language": "en",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjMjE2MWFjZGZhMDhmMjg1YzMzYzQ0YyIsInJvbGVzIjpbInNob3BwZXIiXSwiaWF0IjoxNTQ2NzMzMTIxLCJleHAiOjE1NDY4MTk1MjF9.N_hieabS77RTSpUIn3wMVUw6rcW6d6D-Gn63KiTe__A",
    "name": "Saeed",
    "city": {
        "_id": "5c24cee9fb6fc00eee871c09",
        "cityCode": 1,
        "name": {
            "fa": "تهران",
            "en": "Tehran"
        }
    },
    "id": "5c2161acdfa08f285c33c44c"
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
 * @apiErrorExample Invalid code
  HTTP/1.1 400 Bad Request
 {
    "success": false,
    "error" : "invalid code"
 }

  * @apiErrorExample Invalid phone number
  HTTP/1.1 404 Not Found
  {
    "success": false,
    "error" : "invalid phone number"
 }
 */
router.post("/verifycode", auth.verifyToken, usercontoller.verifycode);

/**
 * @api {get} /user/getuserinfo Get User Info
 * @apiName GetUserInfo
 * @apiGroup User
 *
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiHeaderExample {String} Authorization
 * { 
 *    "Authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjMWQ2YzdiNzk3YThmMTQ4MjUxYzZiZSIsInBob25lTnVtYmVyIjoiMDkxOTc2ODIzODYiLCJpYXQiOjE1NDU2NTAxNjksImV4cCI6MTU0NTczNjU2OX0.32Vaz9Zo_g0wD1klKOTzb1VGMy9JusV3dZgTJTyLJ7I"
 * }
 * @apiParam {String} phoneNumber user
 *
 * @apiSuccessExample Success Response 
HTTP/1.1 200 OK
{
    "roles": [
        "user"
    ],
    "_id": "5c2161acdfa08f285c33c44c",
    "phoneNumber": "09388475257",
    "first_name": "Saeed",
    "last_name": "Padyab olsun",
    "city_code": 1,
    "__v": 0,
    "address": "no.41, Block 23, Bosphorous city, 221 Sokak, Kucukcekmace, Istanbul, Turkey",
    "location": {
        "lat": 34.65,
        "long": 54.56
    },
    "avatar": "/docs/img/uploads/avatar-1546717703454.jpeg",
    "notification": true,
    "language": "en",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjMjE2MWFjZGZhMDhmMjg1YzMzYzQ0YyIsInJvbGVzIjpbInNob3BwZXIiXSwiaWF0IjoxNTQ2NzMzMTIxLCJleHAiOjE1NDY4MTk1MjF9.N_hieabS77RTSpUIn3wMVUw6rcW6d6D-Gn63KiTe__A",
    "name": "Saeed",
    "city": {
        "_id": "5c24cee9fb6fc00eee871c09",
        "cityCode": 1,
        "name": {
            "fa": "تهران",
            "en": "Tehran"
        }
    },
    "id": "5c2161acdfa08f285c33c44c"
}
 *
  * @apiErrorExample UnAuthorized
  HTTP/1.1 401 UnAuthorized access
 {
    "success": false,
    "error" : {
       //error details
    }
 }
* @apiErrorExample Servr Error
  HTTP/1.1 500 Internal server error
 {
    "success": false,
    "error" : {
       //error details
    }
 }
 * @apiErrorExample Invalid phoneNumber
  HTTP/1.1 400 Bad Request
 {
    "success": false,
    "error" : "invalid phone number"
 }

  * @apiErrorExample User not found
  HTTP/1.1 404 Not Found
  {
    "success": false,
    "error" : "User not found"
 }
 */
router.get("/info", auth.verifyToken, usercontoller.getinfo);
router.post("/query", auth.verifyToken, usercontoller.query);

/**
 * @api {put} /user/updateprofile Update Profile
 * @apiName UpdateProfile
 * @apiGroup User
 *
 * @apiHeader {String} Authorization Users unique access-key
 * @apiHeaderExample {String} Authorization Example
 * { 
 *    "Authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjMWQ2YzdiNzk3YThmMTQ4MjUxYzZiZSIsInBob25lTnVtYmVyIjoiMDkxOTc2ODIzODYiLCJpYXQiOjE1NDU2NTAxNjksImV4cCI6MTU0NTczNjU2OX0.32Vaz9Zo_g0wD1klKOTzb1VGMy9JusV3dZgTJTyLJ7I"
 * }
 * @apiParam {String} id user
 * @apiParam {String} first_name User first name
 * @apiParam {String} last_name User last name
 * @apiParam {String} address User address
 * @apiSuccessExample Success Response 
HTTP/1.1 200 OK
{
    "roles": [
        "user"
    ],
    "_id": "5c2161acdfa08f285c33c44c",
    "phoneNumber": "09388475257",
    "first_name": "Saeed",
    "last_name": "Padyab olsun",
    "city_code": 1,
    "__v": 0,
    "address": "no.41, Block 23, Bosphorous city, 221 Sokak, Kucukcekmace, Istanbul, Turkey",
    "location": {
        "lat": 34.65,
        "long": 54.56
    },
    "avatar": "/docs/img/uploads/avatar-1546717703454.jpeg",
    "notification": true,
    "language": "en",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjMjE2MWFjZGZhMDhmMjg1YzMzYzQ0YyIsInJvbGVzIjpbInNob3BwZXIiXSwiaWF0IjoxNTQ2NzMzMTIxLCJleHAiOjE1NDY4MTk1MjF9.N_hieabS77RTSpUIn3wMVUw6rcW6d6D-Gn63KiTe__A",
    "name": "Saeed",
    "city": {
        "_id": "5c24cee9fb6fc00eee871c09",
        "cityCode": 1,
        "name": {
            "fa": "تهران",
            "en": "Tehran"
        }
    },
    "id": "5c2161acdfa08f285c33c44c"
}
 *
  * @apiErrorExample UnAuthorized
  HTTP/1.1 401 UnAuthorized access
 {
    "success": false,
    "error" : {
       //error details
    }
 }
* @apiErrorExample Servr Error
HTTP/1.1 500 Internal server error
 {
    "success": false,
    "error" : {
       //error details
    }
 }

 * @apiErrorExample User Not Found
 HTTP/1.1 404 User Not Found
 {
    "success": false,
    "error" : {
       "error" : "invalid id"
    }
 }
 */
router.put("/updateprofile", auth.verifyToken, usercontoller.updateprofile);
module.exports = router;