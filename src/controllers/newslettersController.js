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


exports.add = [
  (req, res, next) => {

    var ctype = "";
    switch (req.spaceId.toString()) {
      default:
        ctype = "5ef98dd7911086001a08258a";
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