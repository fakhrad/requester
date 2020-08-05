const {
  body,
  validationResult
} = require("express-validator/check");
const {
  sanitizeBody
} = require("express-validator/filter");
const culture = process.env.CULTURE | "fa-IR";
const broker = require("./serviceBroker");
const Tokens = require("../models/token");
const Contents = require("../models/content");
const ContentTypes = require("../models/contentType");
const jwt = require("jsonwebtoken");
const config = require("../config");
const mongoose = require('mongoose')
const helper = require('./helper')
const async = require('async')

var sendVerifyCode = function (phoneNumber, code, deviceToken, clientId) {
  if (process.env.NODE_ENV == "production") {
    broker
      .sendRPCMessage({
        body: {
          phoneNumber: phoneNumber,
          code: code,
          clientId: clientId
        }
      },
        "sendVerifyCode"
      )
      .then(result => {
        var obj = JSON.parse(result.toString("utf8"));
        if (!obj.success)
          console.log(
            "Code not sent. Error code : " +
            obj.error +
            " response : " +
            obj.data
          );
        else
          console.log("Code(" + code + ") successfully sent to " + phoneNumber);
      });
  } else {
    if (deviceToken) {
      broker
        .sendRPCMessage({
          body: {
            device: deviceToken,
            message: {
              body: "Your verification code is :" + code,
              title: "Verification code"
            },
            data: {
              type: "LOGIN_VERIFICATION"
            }
          }
        },
          "sendPushMessage"
        )
        .then(result => {
          var obj = JSON.parse(result.toString("utf8"));
          if (!obj.success)
            console.log(
              "Push message not sent. Error code : " +
              obj.error +
              " response : " +
              obj.data
            );
          else console.log("Push message successfully sent");
        });
    }
  }
};

var generateToken = function (client, authenticated, expireTime, scope) {
  var token;
  token = jwt.sign({
    clientId: client,
    scope: scope,
    authenticated: authenticated
  },
    config.secret, {
      expiresIn: expireTime
    }
  );
  return token;
};

function getNewCode(phoneNumber) {
  var min = 1000;
  var max = 9999;
  var code = Math.floor(Math.random() * (max - min)) + min;
  //Sent code to the phone
  return code;
}
exports.requestcode = [
  body("phoneNumber", "Phone number is required")
    .not()
    .isEmpty()
    .withMessage("Phone number is required")
    .isNumeric()
    .isLength({
      min: 11,
      max: 14
    })
    .withMessage("Phone number is invalid")
    .matches(/^(\+98|0)?9\d{9}$/)
    .withMessage("Phone number is in invalid format"),
  (req, res, next) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      //There are errors. send error result
      return res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        errors: errors.array()
      });
      return;
    } else {
      console.log(req.body);

      var accessToken = new Tokens({
        accessToken: generateToken(req.clientId, false, 5 * 60 * 60, "verify"),
        accessTokenExpiresOn: process.env.TEMP_TOKEN_EXPIRE_TIME || 5 * 60 * 60,
        clientId: req.clientId,
        refreshToken: undefined,
        accessTokenExpiresOn: undefined,
        userId: req.body.phoneNumber,
        deviceToken: req.headers.devicetoken ?
          req.headers.devicetoken : req.headers.deviceToken,
        os: req.headers.os,
        version: req.headers.version,
        issueDate: new Date(),
        role: "partner"
      });
      accessToken.activation_code = getNewCode();
      accessToken.authenticated = false;
      // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
      return new Promise(function (resolve, reject) {
        accessToken.save(function (err, data) {
          if (err) reject(err);
          else resolve(data);
        });
      }).then(function (saveResult) {
        // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
        saveResult =
          saveResult && typeof saveResult == "object" ?
            saveResult.toJSON() :
            saveResult;
        console.log(saveResult);
        //Send activation code to user phone
        sendVerifyCode(
          req.body.phoneNumber,
          saveResult.activation_code,
          saveResult.deviceToken ? saveResult.deviceToken : undefined,
          req.clientId
        );
        if (process.env.NODE_ENV == "production")
          res.status(200).json({
            success: true,
            authenticated: false,
            message: "Code generated and sent to your phone"
          });
        else
          res.status(200).json({
            success: true,
            authenticated: false,
            access_token: saveResult.access_token,
            activation_code: saveResult.activation_code,
            message: "Code generated and sent to your phone"
          });

        return saveResult;
      });
    }
  }
];

exports.verifycode = [
  body("phoneNumber", "Phone number is required")
    .not()
    .isEmpty()
    .withMessage("Phone number is required")
    .isNumeric()
    .isLength({
      min: 11,
      max: 14
    })
    .withMessage("Phone number is invalid")
    .matches(/^(\+98|0)?9\d{9}$/)
    .withMessage("Phone number is in invalid format"),
  body("code", "Code is required")
    .not()
    .isEmpty()
    .withMessage("Code is required")
    .isNumeric()
    .isLength({
      min: 4,
      max: 4
    })
    .withMessage("Code is invalid"),
  //Sanitize fields
  sanitizeBody("code")
    .trim()
    .escape(),
  sanitizeBody("phoneNumber")
    .trim()
    .escape(),
  (req, res, next) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      //There are errors. send error result
      return res.status(422).json({
        success: false,
        code: "INVALID_REQUEST",
        errors: errors.array()
      });
      return;
    } else {
      console.log({
        clientId: req.clientId,
        userId: req.body.phoneNumber,
        activation_code: req.body.code,
        authenticated: false
      });
      Tokens.findOne({
        clientId: req.clientId,
        userId: req.body.phoneNumber,
        activation_code: req.body.code,
        authenticated: false
      }).exec(function (err, tkn) {
        var result = {
          success: false,
          message: undefined,
          error: "Invalid code"
        };
        if (err) {
          res.status(400).send(result);
          return;
        }
        if (tkn) {
          var token = generateToken(
            req.clientId,
            true,
            30 * 24 * 60 * 60,
            "read/write"
          );
          var accessToken = new Tokens({
            accessToken: token,
            accessTokenExpiresOn: process.env.TEMP_TOKEN_EXPIRE_TIME || 30 * 24 * 60 * 60,
            clientId: req.clientId,
            refreshToken: tkn.accessToken,
            accessTokenExpiresOn: undefined,
            userId: req.body.phoneNumber,
            deviceToken: tkn.deviceToken,
            os: tkn.os,
            version: tkn.version,
            authenticated: true
          });
          tkn.remove(() => {
            console.log("Token removed : " + tkn);
          });
          accessToken.save((err, data) => {
            if (err) {
              res
                .status(500)
                .send({
                  success: false,
                  error: "Unable to generate token"
                });
              return;
            }
            res.send({
              success: true,
              access_token: token,
              expiresIn: 30 * 24 * 60 * 60
            });
          });
        } else {
          res.status(403).send({
            success: false,
            error: "Invalid code"
          });
        }
      });
    }
  }
];

exports.updateprofile = [
  body("id", "Id must not be empty"),
  // Validate fields
  // body("fields.name", "Name is required")
  //   .not()
  //   .isEmpty()
  //   .withMessage("Name is required"),
  // body("fields.phonenumber", "Phone number is invalid")
  //   .isMobilePhone("fa-IR")
  //   .withMessage("Phone number is invalid"),
  // body("fields.email", "Email is required")
  //   .not()
  //   .isEmpty()
  //   .withMessage("fields.email", "Email is invalid"),
  // body("fields.city", "City is required"),
  // //Sanitize fields
  // sanitizeBody("fields.phonenumber")
  //   .trim()
  //   .escape(),
  // sanitizeBody("fields.name")
  //   .trim()
  //   .escape(),
  // sanitizeBody("fields.email")
  //   .trim()
  //   .escape(),
  // //Sanitize fields
  sanitizeBody("id")
    .trim()
    .escape(),
  (req, res, next) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      //There are errors. send error result
      res.status(400).json({
        success: false,
        error: errors
      });
      return;
    } else {
      broker
        .sendRPCMessage({
          spaceId: req.spaceId.toString(),
          userId: req.userId,
          body: req.body
        },
          "partialupdatecontent"
        )
        .then(result => {
          var obj = JSON.parse(result.toString("utf8"));
          if (!obj.success) {
            if (obj.error) return res.status(500).json(obj);
            else {
              obj.error = "invalid id";
              res.status(404).json(obj);
            }
          } else {
            res.status(200).json(obj.data);
          }
        });
    }
  }
];

exports.getinfo = [
  (req, res, next) => {
    var result = {
      success: false,
      message: undefined,
      error: "Invalid code"
    };

    var lang = req.query.lang;
    delete req.query.lang;
    if (!req.userId && !req.query.id && !req.query.key) {
      result.message = "Invalid request";
      result.code = "Invalid_request";
      res.status(400).send(result);
      return;
    }
    var ctype = "";
    switch (req.spaceId.toString()) {
      case "5d26e793375e9b001745e84d":
        ctype = "5d3fc9b97029a500172c5c48"
        break;
      case "5cf3883dcce4de00174d48cf":
        ctype = "5d358ebc8e6e9a0017c28fc9";
        break;
    }
    if (ctype === "")
      ctype = req.query.contentType
    console.log("spaceId :" + req.spaceId + " userId :" + req.query.id || req.userId)
    var q = {
      contentType: ctype
    };
    var f = false;
    if (req.query.id) {
      q["_id"] = req.query.id
      f = true;
    }
    if (req.query.key) {
      q["fields.partnerkey"] = req.query.key
      f = true;
    }
    if (!f)
      q["fields.phonenumber"] = req.userId

    Contents.findOne(q).select("fields _id contentType status").exec((err, partner) => {
      if (err) {
        result.error = err;
        result.code = "InternalError";
        res.status(500).send(result);
        return;
      }
      if (!partner) {
        result.error = "Not found";
        result.code = "NotFound";
        res.status(404).send(result);
        return;
      }

      ContentTypes.findById(ctype).exec((err, ctype) => {
        if (err) {

          result.success = true;
          result.error = undefined;
          result.data = partner;
          res.status(200).send(result);
          return;
        }
        var relfields = [];
        for (var field in ctype.fields) {
          if (ctype.fields[field].type === "reference") {
            var references = ctype.fields[field].references;
            if (references) {
              references.forEach(ref => {
                relfields.push({
                  name: ctype.fields[field].name,
                  ctype: ref,
                  select: ctype.fields[field].fields
                });
              });
            }
          }
        }
        var reldata = [];
        if (relfields.length > 0) {
          var ids = [];
          relfields.forEach(fld => {
            if (
              partner.fields[fld.name] &&
              partner.fields[fld.name].length > 0
            ) {
              if (helper.isArray(partner.fields[fld.name])) {
                partner.fields[fld.name].forEach(item => {
                  if (
                    item.length > 0 &&
                    mongoose.Types.ObjectId.isValid(item)
                  )
                    ids.push(item);
                });
              } else {
                if (mongoose.Types.ObjectId.isValid(partner.fields[fld.name]))
                  ids.push(partner.fields[fld.name]);
              }
            }
          });
          Contents.find({
            _id: {
              $in: ids
            }
          })
            .select("fields _id contentType status")
            .exec((err, rels) => {
              if (err) {
                console.log(err);

                result.success = true;
                result.error = undefined;
                result.data = partner;
                res.status(200).send(result);
                return;
              }
              relfields.forEach(fld => {
                if (
                  partner.fields[fld.name] &&
                  partner.fields[fld.name].length > 0
                ) {
                  if (helper.isArray(partner.fields[fld.name])) {
                    for (i = 0; i < partner.fields[fld.name].length; i++) {
                      var item = partner.fields[fld.name][i];
                      var row = rels.filter(
                        a => a._id.toString() === item.toString()
                      );
                      if (row.length > 0) {
                        partner.fields[fld.name][i] = row[0];
                      }
                    }
                  } else {
                    var row = rels.filter(
                      a =>
                        a._id.toString() ===
                        partner.fields[fld.name].toString()
                    );
                    if (row.length > 0) {
                      partner.fields[fld.name] = row[0];
                    }
                  }
                }
              });

              result.success = true;
              result.error = undefined;
              var d = helper.lean(partner.fields, lang);

              result.data = {
                _id: partner._id,
                fields: d
              }
              res.status(200).send(result);
            });
        }
      });
    })
  }
];

var findAll = function (req, res, next) {
  console.log("Find All")
  var drange = undefined;
  if (req.body && req.body.daterange)
    drange = req.body.daterange;
  if (req.query && req.query.daterange)
    drange = req.query.daterange;
  var start, end;
  var lang = req.query.lang;
  var rows = [];
  var format = "%Y-%m-%dT%H:%M:%S";
  var date = undefined
  if (drange != undefined) {
    date = {};
    switch (drange) {
      case "today":
        start = new Date();
        start.setDate(start.getDate());
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%H:00"
        break;
      case "yesterday":
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        format = "%H:00"
        break;
      case "last7days":
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%m-%d"
        break;
      case "last30days":
        start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%m-%d"
        break;
      case "last6months":
        start = new Date();
        start.setMonth(start.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%Y-%m"
        break;
      case "thisyear":
        start = new Date();
        start.setMonth(0)
        start.setDate(0);
        start.setHours(0, 0, 0, 1);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        format = "%Y-%m"
        break;
      default:
      case "lifetime":
        date = undefined;
        format = "%Y-%m"
        break;
      case "custom":
        start = new Date(req.query.startDate);
        end = new Date(req.query.endDate);
        format = "%Y-%m-%d"
        break;
    }
  }

  var ctype = "";
  switch (req.spaceId.toString()) {
    case "5d26e793375e9b001745e84d":
      ctype = "5d3fc9b97029a500172c5c48"
      break;
    default:
      ctype = "5d358ebc8e6e9a0017c28fc9";
      break;
  }
  if (ctype === "")
    ctype = req.query.contentType
  console.log("spaceId :" + req.spaceId + " userId :" + req.query.id || req.userId)
  var params = {
    "sys.spaceId": req.spaceId,
    contentType: ctype,
    "status": "published"
  }

  if (req.body && req.body.contentType)
    params.contentType = new mongoose.Types.ObjectId(req.body.contentType)
  if (req.query && req.query.contentType)
    params.contentType = new mongoose.Types.ObjectId(req.query.contentType)


  if (date != undefined) {
    params["sys.issueDate"] = {
      "$gt": start,
      "$lt": end
    }
  }
  var skip = req.query ? parseInt(req.query.skip) || 0 : 0;
  var limit = req.query ? parseInt(req.query.limit) || 10000 : 10000;
  var sort = req.query ? req.query.sort || "sys.issueDate" : "sys.issueDate";
  var loadrelations = req.query.loadrelations == "false" ? false : true;
  delete req.query.loadrelations;
  var select = "fields _id";;
  if (req.query) {
    delete req.query.skip;
    delete req.query.limit;
    delete req.query.sort;
    select = req.query.select;
    if (req.query.name) {
      params["fields.fullname." + lang] = {
        $regex: ".*" + req.query.name + ".*",
        $options: 'i'
      };
    }
    if (req.query.status) {
      if (helper.isArray(req.query.status)) {
        params.status = {
          $in: req.query.status
        }
      } else {
        params.status = req.query.status;
      }
    }

    if (req.query.contentType) {
      if (helper.isArray(req.query.contentType)) {
        params.contentType = {
          $in: req.query.contentType
        }
      } else {
        params.contentType = req.query.contentType;
      }
    }

    if (req.query.search) {
      for (i = 0; i < Object.keys(req.body.search).length; i++) {
        var field = req.body.search[i];
        if (helper.isArray(req.body.search[field])) {
          params[field] = {
            $all: req.body.search[field]
          }
        } else {
          params[field] = req.body.search[field];
        }
      }
    }
  }

  if (req.body) {
    if (!select && req.body.select)
      select = req.body.select || "fields.name fields.description status sys contentType";
    if (req.body.name) {
      params["fields.fullname." + lang] = {
        $regex: ".*" + req.body.name + ".*",
        $options: 'i'
      };
    }
    if (req.body.status) {
      if (helper.isArray(req.body.status)) {
        params.status = {
          $in: req.body.status
        }
      } else {
        params.status = req.body.status;
      }
    }
    if (req.body.contentType) {
      if (helper.isArray(req.body.contentType)) {
        params.contentType = {
          $in: req.body.contentType
        }
      } else {
        params.contentType = req.body.contentType;
      }
    }
    if (req.body.search) {
      for (i = 0; i < Object.keys(req.body.search).length; i++) {
        console.log(Object.keys(req.body.search)[i])
        var field = Object.keys(req.body.search)[i];
        if (helper.isArray(req.body.search[field])) {
          params[field] = {
            $all: req.body.search[field]
          }
        } else {
          params[field] = req.body.search[field];
        }
      }
    }
  }
  console.log(JSON.stringify(params));

  async.parallel({
    "contents": function (callback) {
      Contents.find(params)
        .populate("contentType", "title media")
        .select(select)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .exec(function (err, contents) {
          callback(err, contents)
        });
    },
    "ctype": function (callback) {
      ContentTypes.findById(ctype).exec((err, ctype) => {
        callback(err, ctype)
      });

    }
  }, (errs, results) => {
    if (errs && errs.length > 0) {
      res.status(500).send({
        success: false,
        error: errs
      });
      return;
    }
    var ctype = results.ctype;
    var contents = results.contents;
    if (!ctype) {
      console.log("contentType not found.")
      res.status(500).send({
        success: false,
        error: "contentType not found"
      });
      return;
    }
    if (!contents) {
      console.log("contents not found.")
      res.status(500).send({
        success: false,
        error: "Contents not found"
      });
      return;
    }
    var relfields = [];
    for (var field in ctype.fields) {
      if (ctype.fields[field].type === "reference") {
        var references = ctype.fields[field].references;
        if (references) {
          references.forEach(ref => {
            relfields.push({
              name: ctype.fields[field].name,
              ctype: ref,
              select: ctype.fields[field].fields
            });
          });
        }
      }
    }
    if (relfields.length > 0) {
      var ids = [];
      relfields.forEach(fld => {
        contents.forEach(content => {
          if (
            content.fields[fld.name] &&
            content.fields[fld.name].length > 0
          ) {
            if (helper.isArray(content.fields[fld.name])) {
              content.fields[fld.name].forEach(item => {
                if (
                  item.length > 0 &&
                  mongoose.Types.ObjectId.isValid(item)
                )
                  ids.push(item);
              });
            } else {
              if (mongoose.Types.ObjectId.isValid(content.fields[fld.name]))
                ids.push(content.fields[fld.name]);
            }
          }
        });
      });
      Contents.find({
        _id: {
          $in: ids
        }
      })
        .select("fields _id contentType status")
        .exec((err, rels) => {
          if (err) {
            console.log(err);
            res.send(contents);
            return;
          }
          relfields.forEach(fld => {
            contents.forEach(content => {
              if (
                content.fields[fld.name] &&
                content.fields[fld.name].length > 0
              ) {
                if (helper.isArray(content.fields[fld.name])) {
                  for (i = 0; i < content.fields[fld.name].length; i++) {
                    var item = content.fields[fld.name][i];
                    var row = rels.filter(
                      a => a._id.toString() === item.toString()
                    );
                    if (row.length > 0) {
                      content.fields[fld.name][i] = row[0];
                    }
                  }
                } else {
                  var row = rels.filter(
                    a =>
                      a._id.toString() ===
                      content.fields[fld.name].toString()
                  );
                  if (row.length > 0) {
                    content.fields[fld.name] = row[0];
                  }
                }
              }
            });
          });

          var result = {
            success: false,
            data: null,
            error: null
          };
          if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            res.status(500).send(result);
            return;
          }
          if (contents) {
            result.success = true;
            result.error = undefined;
            for (i = 0; i <= contents.length - 1; i++) {
              var content = contents[i].fields;
              var r = helper.lean(content, lang);
              r["_id"] = contents[i]._id
              rows.push(r);
            }
            result.data = rows;
            res.status(200).send(result);
          } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            res.status(404).send(result);
          }
        });
    } else {
      if (contents) {
        res.status(200).send(contents);
      } else {
        res.status(500).send({
          success: false,
          data: undefined,
          error: "contents not found"
        })
      }
    }
  })

};

var mostPopularPlaces = function (req, res, next) {
  console.log("Find most popular places")
  var drange = undefined;
  if (req.body && req.body.daterange)
    drange = req.body.daterange;
  if (req.query && req.query.daterange)
    drange = req.query.daterange;
  var start, end;
  var lang = req.query.lang;
  var rows = [];
  var format = "%Y-%m-%dT%H:%M:%S";
  var date = undefined
  if (drange != undefined) {
    date = {};
    switch (drange) {
      case "today":
        start = new Date();
        start.setDate(start.getDate());
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%H:00"
        break;
      case "yesterday":
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        format = "%H:00"
        break;
      case "last7days":
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%m-%d"
        break;
      case "last30days":
        start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%m-%d"
        break;
      case "last6months":
        start = new Date();
        start.setMonth(start.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%Y-%m"
        break;
      case "thisyear":
        start = new Date();
        start.setMonth(0)
        start.setDate(0);
        start.setHours(0, 0, 0, 1);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        format = "%Y-%m"
        break;
      default:
      case "lifetime":
        date = undefined;
        format = "%Y-%m"
        break;
      case "custom":
        start = new Date(req.query.startDate);
        end = new Date(req.query.endDate);
        format = "%Y-%m-%d"
        break;
    }
  }

  var ctype = "";
  switch (req.spaceId.toString()) {
    case "5d26e793375e9b001745e84d":
      ctype = "5d3fc9b97029a500172c5c48"
      break;
    default:
      ctype = "5d358ebc8e6e9a0017c28fc9";
      break;
  }
  if (ctype === "")
    ctype = req.query.contentType
  console.log("spaceId :" + req.spaceId + " userId :" + req.query.id || req.userId)
  var params = {
    "sys.spaceId": req.spaceId,
    contentType: ctype,
    "status": "published",
    "fields.mostpopularpos": { $ne: null }
  }

  if (req.body && req.body.contentType)
    params.contentType = new mongoose.Types.ObjectId(req.body.contentType)
  if (req.query && req.query.contentType)
    params.contentType = new mongoose.Types.ObjectId(req.query.contentType)


  if (date != undefined) {
    params["sys.issueDate"] = {
      "$gt": start,
      "$lt": end
    }
  }
  var skip = req.query ? parseInt(req.query.skip) || 0 : 0;
  var limit = req.query ? parseInt(req.query.limit) || 10000 : 10000;
  var sort = req.query ? (req.query.sort ? req.query.sort : "fields.mostpopularpos") : "fields.mostpopularpos";
  var loadrelations = req.query.loadrelations == "false" ? false : true;
  delete req.query.loadrelations;
  var select = "fields _id";;
  if (req.query) {
    delete req.query.skip;
    delete req.query.limit;
    delete req.query.sort;
    select = req.query.select;
    if (req.query.name) {
      params["fields.name"] = {
        $regex: ".*" + req.query.name + ".*",
        $options: 'i'
      };
    }
    if (req.query.status) {
      if (helper.isArray(req.query.status)) {
        params.status = {
          $in: req.query.status
        }
      } else {
        params.status = req.query.status;
      }
    }

    if (req.query.contentType) {
      if (helper.isArray(req.query.contentType)) {
        params.contentType = {
          $in: req.query.contentType
        }
      } else {
        params.contentType = req.query.contentType;
      }
    }

    if (req.query.search) {
      for (i = 0; i < Object.keys(req.body.search).length; i++) {
        var field = req.body.search[i];
        if (helper.isArray(req.body.search[field])) {
          params[field] = {
            $all: req.body.search[field]
          }
        } else {
          params[field] = req.body.search[field];
        }
      }
    }
  }

  if (req.body) {
    if (!select && req.body.select)
      select = req.body.select || "fields.name fields.description status sys contentType";
    if (req.body.name) {
      params["feilds.name"] = {
        $regex: ".*" + req.body.name + ".*",
        $options: 'i'
      };
    }
    if (req.body.status) {
      if (helper.isArray(req.body.status)) {
        params.status = {
          $in: req.body.status
        }
      } else {
        params.status = req.body.status;
      }
    }
    if (req.body.contentType) {
      if (helper.isArray(req.body.contentType)) {
        params.contentType = {
          $in: req.body.contentType
        }
      } else {
        params.contentType = req.body.contentType;
      }
    }
    if (req.body.search) {
      for (i = 0; i < Object.keys(req.body.search).length; i++) {
        console.log(Object.keys(req.body.search)[i])
        var field = Object.keys(req.body.search)[i];
        if (helper.isArray(req.body.search[field])) {
          params[field] = {
            $all: req.body.search[field]
          }
        } else {
          params[field] = req.body.search[field];
        }
      }
    }
  }
  console.log(JSON.stringify(params));

  async.parallel({
    "contents": function (callback) {
      Contents.find(params)
        .populate("contentType", "title media")
        .select(select)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .exec(function (err, contents) {
          callback(err, contents)
        });
    },
    "ctype": function (callback) {
      ContentTypes.findById(ctype).exec((err, ctype) => {
        callback(err, ctype)
      });

    }
  }, (errs, results) => {
    if (errs && errs.length > 0) {
      res.status(500).send({
        success: false,
        error: errs
      });
      return;
    }
    var ctype = results.ctype;
    var contents = results.contents;
    if (!ctype) {
      console.log("contentType not found.")
      res.status(500).send({
        success: false,
        error: "contentType not found"
      });
      return;
    }
    if (!contents) {
      console.log("contents not found.")
      res.status(500).send({
        success: false,
        error: "Contents not found"
      });
      return;
    }
    var relfields = [];
    for (var field in ctype.fields) {
      if (ctype.fields[field].type === "reference") {
        var references = ctype.fields[field].references;
        if (references) {
          references.forEach(ref => {
            relfields.push({
              name: ctype.fields[field].name,
              ctype: ref,
              select: ctype.fields[field].fields
            });
          });
        }
      }
    }
    if (relfields.length > 0) {
      var ids = [];
      relfields.forEach(fld => {
        contents.forEach(content => {
          if (
            content.fields[fld.name] &&
            content.fields[fld.name].length > 0
          ) {
            if (helper.isArray(content.fields[fld.name])) {
              content.fields[fld.name].forEach(item => {
                if (
                  item.length > 0 &&
                  mongoose.Types.ObjectId.isValid(item)
                )
                  ids.push(item);
              });
            } else {
              if (mongoose.Types.ObjectId.isValid(content.fields[fld.name]))
                ids.push(content.fields[fld.name]);
            }
          }
        });
      });
      Contents.find({
        _id: {
          $in: ids
        }
      })
        .select("fields _id contentType status")
        .exec((err, rels) => {
          if (err) {
            console.log(err);
            res.send(contents);
            return;
          }
          relfields.forEach(fld => {
            contents.forEach(content => {
              if (
                content.fields[fld.name] &&
                content.fields[fld.name].length > 0
              ) {
                if (helper.isArray(content.fields[fld.name])) {
                  for (i = 0; i < content.fields[fld.name].length; i++) {
                    var item = content.fields[fld.name][i];
                    var row = rels.filter(
                      a => a._id.toString() === item.toString()
                    );
                    if (row.length > 0) {
                      content.fields[fld.name][i] = row[0];
                    }
                  }
                } else {
                  var row = rels.filter(
                    a =>
                      a._id.toString() ===
                      content.fields[fld.name].toString()
                  );
                  if (row.length > 0) {
                    content.fields[fld.name] = row[0];
                  }
                }
              }
            });
          });

          var result = {
            success: false,
            data: null,
            error: null
          };
          if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            res.status(500).send(result);
            return;
          }
          if (contents) {
            result.success = true;
            result.error = undefined;
            for (i = 0; i <= contents.length - 1; i++) {
              var content = contents[i].fields;
              var r = helper.lean(content, lang);
              r["_id"] = contents[i]._id
              rows.push(r);
            }
            result.data = rows;
            res.status(200).send(result);
          } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            res.status(404).send(result);
          }
        });
    } else {
      if (contents) {
        res.status(200).send(contents);
      } else {
        res.status(500).send({
          success: false,
          data: undefined,
          error: "contents not found"
        })
      }
    }
  })

};

var newPlaces = function (req, res, next) {
  console.log("Find new places")
  var drange = undefined;
  if (req.body && req.body.daterange)
    drange = req.body.daterange;
  if (req.query && req.query.daterange)
    drange = req.query.daterange;
  var start, end;
  var lang = req.query.lang;
  var rows = [];
  var format = "%Y-%m-%dT%H:%M:%S";
  var date = undefined
  if (drange != undefined) {
    date = {};
    switch (drange) {
      case "today":
        start = new Date();
        start.setDate(start.getDate());
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%H:00"
        break;
      case "yesterday":
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        format = "%H:00"
        break;
      case "last7days":
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%m-%d"
        break;
      case "last30days":
        start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%m-%d"
        break;
      case "last6months":
        start = new Date();
        start.setMonth(start.getMonth() - 6);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate());
        end.setHours(23, 59, 59, 999);
        format = "%Y-%m"
        break;
      case "thisyear":
        start = new Date();
        start.setMonth(0)
        start.setDate(0);
        start.setHours(0, 0, 0, 1);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        format = "%Y-%m"
        break;
      default:
      case "lifetime":
        date = undefined;
        format = "%Y-%m"
        break;
      case "custom":
        start = new Date(req.query.startDate);
        end = new Date(req.query.endDate);
        format = "%Y-%m-%d"
        break;
    }
  }

  var ctype = "";
  switch (req.spaceId.toString()) {
    case "5d26e793375e9b001745e84d":
      ctype = "5d3fc9b97029a500172c5c48"
      break;
    default:
      ctype = "5d358ebc8e6e9a0017c28fc9";
      break;
  }
  if (ctype === "")
    ctype = req.query.contentType
  console.log("spaceId :" + req.spaceId + " userId :" + req.query.id || req.userId)
  var params = {
    "sys.spaceId": req.spaceId,
    contentType: ctype,
    "status": "published"
  }

  if (req.body && req.body.contentType)
    params.contentType = new mongoose.Types.ObjectId(req.body.contentType)
  if (req.query && req.query.contentType)
    params.contentType = new mongoose.Types.ObjectId(req.query.contentType)


  if (date != undefined) {
    params["sys.issueDate"] = {
      "$gt": start,
      "$lt": end
    }
  }
  var skip = req.query ? parseInt(req.query.skip) || 0 : 0;
  var limit = req.query ? parseInt(req.query.limit) || 10000 : 10000;
  var sort = "-sys.issueDate";
  var loadrelations = req.query.loadrelations == "false" ? false : true;
  delete req.query.loadrelations;
  var select = "fields _id";;
  if (req.query) {
    delete req.query.skip;
    delete req.query.limit;
    delete req.query.sort;
    select = req.query.select;
    if (req.query.name) {
      params["fields.name"] = {
        $regex: ".*" + req.query.name + ".*",
        $options: 'i'
      };
    }
    if (req.query.status) {
      if (helper.isArray(req.query.status)) {
        params.status = {
          $in: req.query.status
        }
      } else {
        params.status = req.query.status;
      }
    }

    if (req.query.contentType) {
      if (helper.isArray(req.query.contentType)) {
        params.contentType = {
          $in: req.query.contentType
        }
      } else {
        params.contentType = req.query.contentType;
      }
    }

    if (req.query.search) {
      for (i = 0; i < Object.keys(req.body.search).length; i++) {
        var field = req.body.search[i];
        if (helper.isArray(req.body.search[field])) {
          params[field] = {
            $all: req.body.search[field]
          }
        } else {
          params[field] = req.body.search[field];
        }
      }
    }
  }

  if (req.body) {
    if (!select && req.body.select)
      select = req.body.select || "fields.name fields.description status sys contentType";
    if (req.body.name) {
      params["feilds.name"] = {
        $regex: ".*" + req.body.name + ".*",
        $options: 'i'
      };
    }
    if (req.body.status) {
      if (helper.isArray(req.body.status)) {
        params.status = {
          $in: req.body.status
        }
      } else {
        params.status = req.body.status;
      }
    }
    if (req.body.contentType) {
      if (helper.isArray(req.body.contentType)) {
        params.contentType = {
          $in: req.body.contentType
        }
      } else {
        params.contentType = req.body.contentType;
      }
    }
    if (req.body.search) {
      for (i = 0; i < Object.keys(req.body.search).length; i++) {
        console.log(Object.keys(req.body.search)[i])
        var field = Object.keys(req.body.search)[i];
        if (helper.isArray(req.body.search[field])) {
          params[field] = {
            $all: req.body.search[field]
          }
        } else {
          params[field] = req.body.search[field];
        }
      }
    }
  }
  console.log(JSON.stringify(params));

  async.parallel({
    "contents": function (callback) {
      Contents.find(params)
        .populate("contentType", "title media")
        .select(select)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .exec(function (err, contents) {
          callback(err, contents)
        });
    },
    "ctype": function (callback) {
      ContentTypes.findById(ctype).exec((err, ctype) => {
        callback(err, ctype)
      });

    }
  }, (errs, results) => {
    if (errs && errs.length > 0) {
      res.status(500).send({
        success: false,
        error: errs
      });
      return;
    }
    var ctype = results.ctype;
    var contents = results.contents;
    if (!ctype) {
      console.log("contentType not found.")
      res.status(500).send({
        success: false,
        error: "contentType not found"
      });
      return;
    }
    if (!contents) {
      console.log("contents not found.")
      res.status(500).send({
        success: false,
        error: "Contents not found"
      });
      return;
    }
    var relfields = [];
    for (var field in ctype.fields) {
      if (ctype.fields[field].type === "reference") {
        var references = ctype.fields[field].references;
        if (references) {
          references.forEach(ref => {
            relfields.push({
              name: ctype.fields[field].name,
              ctype: ref,
              select: ctype.fields[field].fields
            });
          });
        }
      }
    }
    if (relfields.length > 0) {
      var ids = [];
      relfields.forEach(fld => {
        contents.forEach(content => {
          if (
            content.fields[fld.name] &&
            content.fields[fld.name].length > 0
          ) {
            if (helper.isArray(content.fields[fld.name])) {
              content.fields[fld.name].forEach(item => {
                if (
                  item.length > 0 &&
                  mongoose.Types.ObjectId.isValid(item)
                )
                  ids.push(item);
              });
            } else {
              if (mongoose.Types.ObjectId.isValid(content.fields[fld.name]))
                ids.push(content.fields[fld.name]);
            }
          }
        });
      });
      Contents.find({
        _id: {
          $in: ids
        }
      })
        .select("fields _id contentType status")
        .exec((err, rels) => {
          if (err) {
            console.log(err);
            res.send(contents);
            return;
          }
          relfields.forEach(fld => {
            contents.forEach(content => {
              if (
                content.fields[fld.name] &&
                content.fields[fld.name].length > 0
              ) {
                if (helper.isArray(content.fields[fld.name])) {
                  for (i = 0; i < content.fields[fld.name].length; i++) {
                    var item = content.fields[fld.name][i];
                    var row = rels.filter(
                      a => a._id.toString() === item.toString()
                    );
                    if (row.length > 0) {
                      content.fields[fld.name][i] = row[0];
                    }
                  }
                } else {
                  var row = rels.filter(
                    a =>
                      a._id.toString() ===
                      content.fields[fld.name].toString()
                  );
                  if (row.length > 0) {
                    content.fields[fld.name] = row[0];
                  }
                }
              }
            });
          });

          var result = {
            success: false,
            data: null,
            error: null
          };
          if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            res.status(500).send(result);
            return;
          }
          if (contents) {
            result.success = true;
            result.error = undefined;
            for (i = 0; i <= contents.length - 1; i++) {
              var content = contents[i].fields;
              var r = helper.lean(content, lang);
              r["_id"] = contents[i]._id
              rows.push(r);
            }
            result.data = rows;
            res.status(200).send(result);
          } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            res.status(404).send(result);
          }
        });
    } else {
      if (contents) {
        res.status(200).send(contents);
      } else {
        res.status(500).send({
          success: false,
          data: undefined,
          error: "contents not found"
        })
      }
    }
  })

};
exports.query = findAll;
exports.mostPopular = mostPopularPlaces;
exports.newPlaces = newPlaces;