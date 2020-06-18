var axios = require("axios");
const async = require("async");
const broker = require("./serviceBroker");
const partnerreject = require('../events/onPartnerRejectedAnApp')
const helper = require('./helper')
exports.myRequestsLean = [
  (req, res, next) => {
    var lang = req.query.lang;
    delete req.query.lang;
    var q = req.query || {};
    if (q) {
      q["sys.issuer"] = req.userId;
      q["sys.spaceId"] = req.spaceId.toString();
      q["sort"] = "-sys.lastUpdateTime";
    }
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/query",
      baseURL: apiRoot,
      method: "get",
      params: q,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        var rows = [];
        for (i = 0; i <= response.data.length - 1; i++) {
          var content = response.data[i].fields;
          var r = helper.lean(content, lang);
          r["_id"] = response.data[i]._id
          rows.push(r);
        }
        res.send(rows);
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

exports.myRequests = [
  (req, res, next) => {
    // if (req.query.lean && req.query.lean == "true")
    //   lean = true;
    // delete req.query.lean;
    // if (req.query.lang)
    //   lang = true;
    // delete req.query.lang;
    var q = req.query || {};
    if (q) {
      q["sys.issuer"] = req.userId;
      q["sys.spaceId"] = req.spaceId.toString();
      q["sort"] = "-sys.lastUpdateTime";
    }
    // req.query.lean = lean;
    // req.query.lang = lang;
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/query",
      baseURL: apiRoot,
      method: "get",
      params: q,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        // if (req.query.lean) {
        //   var rows = [];
        //   console.log(req.query.lean)
        //   for (i = 0; i <= response.data.length - 1; i++) {
        //     var content = response.data[i].fields;
        //     var r = helper.lean(content, req.query.lean);
        //     console.log(JSON.stringify(r))
        //     r["_id"] = response.data[i]._id
        //     rows.push(r);
        //   }
        //   res.send(rows);
        // } else
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

exports.userRequests = [
  (req, res, next) => {
    var q = req.query || {};
    if (q) {
      q["sys.issuer"] = req.userId;
      q["sys.spaceId"] = req.spaceId.toString();
      q["sort"] = "-sys.lastUpdateTime";
    }
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/query",
      baseURL: apiRoot,
      method: "get",
      params: q,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        var arr = [];
        if (response.data && response.data.length > 0) {
          for (i = 0; i < response.data.length; i++) {
            if (response.data[i].fields.product) arr.push(response.data[i]);
          }
        } else arr = response.data;
        res.send(arr);
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
exports.submit = [
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
        console.log(JSON.stringify(obj));
        if (!obj.success) {
          if (obj.error) {
            return res.status(500).json(obj);
          }
        } else {
          //do mach making and submit to partners
          res.status(201).json(obj.data);
        }
      });
  }
];

exports.getRequestsOffers = [
  (req, res, next) => {
    if (req.query && !req.query.limit) {
      req.query.limit = 500;
      req.query.sort = "-sys.lastUpdateTime"
    }
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    req.query["status"] = "published";
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

exports.getNewapplications = [
  (req, res, next) => {
    if (req.query && !req.query.limit) {
      req.query.limit = 500;
    }
    if (req.query && !req.query.sort)
      req.query.sort = "-sys.lastUpdateTime"
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
        console.log(JSON.stringify(response.data));
        var output = [];
        if (response.data && response.data.length > 0) {
          for (i = 0; i <= response.data.length; i++) {
            if (
              response.data[i] &&
              response.data[i].fields &&
              response.data[i].fields.requestid &&
              response.data[i].fields.requestid.fields &&
              response.data[i].fields.partnerid &&
              response.data[i].fields.partnerid.fields
            ) {
              var pn = response.data[i].fields.requestid.fields.phonenumber ?
                response.data[i].fields.requestid.fields.phonenumber :
                response.data[i].fields.requestid.fields.phoneNumber;
              if (
                pn &&
                ([
                    "+989197682386",
                    "+989333229291",
                    "+989125138218",
                    "09197682386",
                    "09333229291",
                    "09126221987",
                    "09125138218"
                  ].indexOf(pn) == -1 ||
                  response.data[i].fields.partnerid.fields.isdevacc)
              ) {
                response.data[
                  i
                ].fields.requestid.fields.phonenumber = undefined;
                response.data[
                  i
                ].fields.requestid.fields.phoneNumber = undefined;
                response.data[i].fields.requestid.fields.fullname = undefined;
                response.data[i].fields.requestid.fields.email = undefined;
                response.data[i].fields.requestid.fields.resume = undefined;
                response.data[i].fields.requestid.fields.avatar = undefined;
                response.data[i].fields.partnerid = undefined;
                if (response.data[i].fields.requestid.status === "published")
                  output.push(response.data[i]);
              }
            }
          }
        }
        res.send(output);
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

exports.getOpenedApplications = [
  (req, res, next) => {
    if (req.query && !req.query.limit) {
      req.query.limit = 500;
    }
    if (req.query && !req.query.sort)
      req.query.sort = "-sys.lastUpdateTime"
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
        var output = [];
        if (response.data && response.data.length > 0) {
          for (i = 0; i <= response.data.length; i++) {
            if (
              response.data[i] &&
              response.data[i].fields &&
              response.data[i].fields.requestid &&
              response.data[i].fields.partnerid &&
              response.data[i].fields.partnerid.fields
            ) {
              var pn = response.data[i].fields.requestid.fields.phonenumber ?
                response.data[i].fields.requestid.fields.phonenumber :
                response.data[i].fields.requestid.fields.phoneNumber;
              if (
                pn &&
                ([
                    "+989197682386",
                    "+989333229291",
                    "+989125138218",
                    "09197682386",
                    "09126221987",
                    "09333229291",
                    "09125138218"
                  ].indexOf(pn) == -1 ||
                  response.data[i].fields.partnerid.fields.isdevacc)
              ) {
                if (response.data[i].fields.requestid.status === "published")
                  output.push(response.data[i]);
              }
            }
          }
        }
        res.send(output);
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

exports.openApplication = [
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
        console.log(JSON.stringify(obj));
        if (!obj.success) {
          if (obj.error) return res.status(500).json(obj);
          else {
            res.status(404).json(obj);
          }
        } else {
          console.log(req);
          var apiRoot =
            process.env.CONTENT_DELIVERY_API ||
            "https://app-dpanel.herokuapp.com";
          var config = {
            url: "/contents/query",
            baseURL: apiRoot,
            method: "get",
            params: {
              _id: obj.data.fields.request ?
                obj.data.fields.request : obj.data.fields.requestid
            },
            headers: {
              authorization: req.headers.authorization,
              clientid: req.spaceId.toString()
            }
          };
          console.log(config);
          axios(config)
            .then(function (response) {
              if (response.data && response.data.length > 0)
                res.send(response.data[0]);
              else res.status(204).send();
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
          //res.status(200).json(obj.data);
        }
      });
  }
];

exports.cancelApplication = [
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

exports.rejectApplication = [
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
        console.log(JSON.stringify(obj));
        if (!obj.success) {
          if (obj.error) return res.status(500).json(obj);
          else {
            res.status(404).json(obj);
          }
        } else {
          partnerreject.onPartnerRejectedAnApp().call(obj.data);
          res.status(200).json(obj.data);
        }
      });
  }
];