const {
  body,
  validationResult
} = require("express-validator/check");
const {
  sanitizeBody
} = require("express-validator/filter");
var express = require("express");
var broker = require("./serviceBroker");
const Contents = require("../models/content");
const ContentTypes = require("../models/contentType");

var async1 = require('async')
var helper = require('./helper')
var mongoose = require('mongoose')
var get = function (req, res, next) {
  console.log("Find new reviews")
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
    default:
      ctype = "5d3eeaba915bfb00174547f4";
      break;
  }
  if (ctype === "")
    ctype = req.query.contentType
  console.log("spaceId :" + req.spaceId + " userId :" + req.params.id || req.userId)
  var params = {
    "sys.spaceId": req.spaceId,
    contentType: ctype,
    "status": "published",
    "fields.objectid": req.params.id
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
  var select = "fields _id sys.issueDate";;
  if (req.query) {
    delete req.query.skip;
    delete req.query.limit;
    delete req.query.sort;
    select = req.query.select;
    if (req.query.name) {
      params["fields.name"] = {
        $regex: ".*" + req.query.name + ".*"
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
      select = req.body.select || "fields.name fields.body status sys contentType";
    if (req.body.name) {
      params["feilds.name"] = {
        $regex: ".*" + req.body.name + ".*"
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

  async1.parallel({
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
    if (loadrelations) {
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
          .select("fields _id sys.issueDate contentType status")
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
                r["issuedate"] = contents[i]["sys"]["issueDate"]
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
        var result = {
          success: false,
          data: null,
          error: null
        };
        if (contents) {
          for (i = 0; i <= contents.length - 1; i++) {
            var content = contents[i].fields;
            var r = helper.lean(content, lang);
            r["_id"] = contents[i]._id
            r["issuedate"] = contents[i]["sys"]["issueDate"]
            rows.push(r);
          }
          result.data = rows;
          res.status(200).send(result);
        } else {
          res.status(500).send({
            success: false,
            data: undefined,
            error: "contents not found"
          })
        }
      }
    }
    else {
      var result = {
        success: false,
        data: null,
        error: null
      };
      if (contents) {
        for (i = 0; i <= contents.length - 1; i++) {
          var content = contents[i].fields;
          var r = helper.lean(content, lang);
          r["_id"] = contents[i]._id
          r["issuedate"] = contents[i]["sys"]["issueDate"]
          rows.push(r);
        }
        result.data = rows;
        res.status(200).send(rows);
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

exports.add = [
  (req, res, next) => {

    var ctype = "";
    switch (req.spaceId.toString()) {
      default:
        ctype = "5d3eeaba915bfb00174547f4";
        break;
    }
    if (ctype === "")
      ctype = req.query.contentType
    console.log("body :" + req.body)
    var params = {
      contentType: ctype,
      fields: req.body
    }
    broker
      .sendRPCMessage({
        body: params,
        userId: req.userId,
        spaceId: req.spaceId
      },
        "addcontent"
      )
      .then(result => {
        var obj = JSON.parse(result.toString("utf8"));
        if (!obj.success) {
          if (obj.error) {
            return res.status(500).json(obj);
          }
        } else {
          res.status(201).json(obj.data);
        }
      });
  }
];

exports.update = function (req, res, next) {
  broker
    .sendRPCMessage({
      spaceId: req.spaceId,
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
          res.status(404).json(obj);
        }
      } else {
        res.status(200).json(obj.data);
      }
    });
};

exports.remove = function (req, res, next) {
  broker
    .sendRPCMessage({
      spaceId: req.spaceId,
      userId: req.userId,
      body: req.body
    },
      "removecontent"
    )
    .then(result => {
      var obj = JSON.parse(result.toString("utf8"));
      if (!obj.success) {
        if (obj.error) return res.status(500).json(obj);
        else {
          res.status(404).json(obj);
        }
      } else {
        res.status(200).json(obj.data);
      }
    });
};

exports.getreviewslist = get