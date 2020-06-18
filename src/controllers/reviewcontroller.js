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

exports.getreviewslist = [
  (req, res, next) => {

  }
];

exports.add = [
  (req, res, next) => {
    broker
      .sendRPCMessage({
          body: req.body,
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