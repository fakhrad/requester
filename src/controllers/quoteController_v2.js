var axios = require("axios");
var express = require("express");
var router = express.Router();
var controller = require("./requestController");
var broker = require("./serviceBroker");

exports.customerAccpet = [
  (req, res, next) => {
    req.body.id = req.params.id;
    broker
      .sendRPCMessage({
          spaceId: req.spaceid,
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
  }
];

exports.customerReject = [
  (req, res, next) => {
    req.body.id = req.params.id;
    broker
      .sendRPCMessage({
          spaceId: req.spaceid,
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
  }
];

exports.wonoffers = [
  (req, res, next) => {
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/graphql",
      baseURL: apiRoot,
      method: "get",
      params: {
        query: '{contents(contentType : "' +
          req.params.contentType +
          '"){ fields, _id, sys{issuer issueDate} }  }'
      },
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        if (response.data && response.data.data && response.data.data.contents)
          res.send(response.data.data.contents);
        else res.send(response.data);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
          res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
          res.status(204).send("No response from server");
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
          res.status(500).send(error.message);
        }
        console.log(error.config);
        res.status(400).send(error.config);
      });
  }
];

exports.acceptedoffers = [
  (req, res, next) => {
    var q = req.query || {};
    if (q) {
      q["sys.issuer"] = req.userId;
    }
    if (q && !q.sort)
      q.sort = "-sys.lastUpdateTime"
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/search",
      baseURL: apiRoot,
      method: "get",
      params: req.query,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
          res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
          res.status(204).send("No response from server");
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
          res.status(500).send(error.message);
        }
        console.log(error.config);
        res.status(400).send(error.config);
      });
  }
];

exports.myoffers = [
  (req, res, next) => {
    var q = req.query || {};
    if (q && !q.sort)
      q.sort = "-sys.lastUpdateTime"
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/search",
      baseURL: apiRoot,
      method: "get",
      params: req.query,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
          res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
          res.status(204).send("No response from server");
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
          res.status(500).send(error.message);
        }
        console.log(error.config);
        res.status(400).send(error.config);
      });
  }
];

exports.lostoffers = [
  (req, res, next) => {
    var q = req.query || {};
    if (q) {
      q["sys.issuer"] = req.userId;
    }
    if (q && !q.sort)
      q.sort = "-sys.lastUpdateTime"
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/search",
      baseURL: apiRoot,
      method: "get",
      params: req.query,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
          res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
          res.status(204).send("No response from server");
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
          res.status(500).send(error.message);
        }
        console.log(error.config);
        res.status(400).send(error.config);
      });
  }
];
exports.issueOffer = [
  (req, res, next) => {
    broker
      .sendRPCMessage({
          body: req.body,
          userId: req.userId,
          spaceId: req.spaceId
        },
        "submitcontent"
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

exports.close = [
  (req, res, next) => {
    req.body.id = req.params.id;
    broker
      .sendRPCMessage({
          spaceId: req.spaceid,
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
  }
];

exports.cancel = [
  (req, res, next) => {
    req.body.id = req.params.id;
    broker
      .sendRPCMessage({
          spaceId: req.spaceid,
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
  }
];