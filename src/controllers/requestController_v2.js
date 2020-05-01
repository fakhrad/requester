var axios = require("axios");
const async = require("async");
const broker = require("./serviceBroker");
const {
  body,
  check,
  validationResult
} = require("express-validator/check");
const {
  sanitizeBody
} = require("express-validator/filter");

exports.myRequests = [
  // Validate fields
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
      var contacttype = "5cf3883dcce4de00174d48cf";
      // switch (req.spaceId.toString()) {
      //   // case "5d26e793375e9b001745e84d":
      //   //   contacttype = "5dc272d251b8310017540c51";
      //   //   break;
      //   case "5cf3883dcce4de00174d48cf":
      //     contacttype = "";
      //     break;
      // }
      var output = {};
      var tasks = {
        contact: function (callback) {
          ///First, query to get existing contact
          var apiRoot =
            process.env.CONTENT_DELIVERY_API ||
            "https://app-dpanel.herokuapp.com";
          var config = {
            url: "/contents/query",
            baseURL: apiRoot,
            method: "get",
            params: {
              contentType: contacttype,
              "fields.phonenumber": req.userId,
              "sys.spaceId": req.spaceId.toString()
            },
            headers: {
              authorization: req.headers.authorization,
              clientid: req.spaceId.toString()
            }
          };
          console.log(config);
          axios(config)
            .then(function (response) {
              if (response.data && response.data.length > 0) {
                //contact exists
                output.contact = response.data[0];
                callback(undefined, response.data[0]);
              } else {
                output.contact = undefined;
                callback(error, undefined);
              }
            })
            .catch(function (error) {
              output.contact = undefined;
              callback(error, undefined);
            });
        },
        requests: function (callback) {
          var requesttype = "5dc0429a93259a00177dacd4";
          switch (req.spaceId.toString()) {
            case "5d26e793375e9b001745e84d":
              requesttype = "5dc0429a93259a00177dacd4";
              break;
            case "5cf3883dcce4de00174d48cf":
              requesttype = "";
              break;
          }
          var apiRoot =
            process.env.CONTENT_DELIVERY_API ||
            "https://app-dpanel.herokuapp.com";
          var config = {
            url: "/contents/query",
            baseURL: apiRoot,
            method: "get",
            params: {
              contentType: requesttype,
              "sys.issuer": output.contact.fields.phonenumber,
              "sys.spaceId": req.spaceId.toString()
            },
            headers: {
              authorization: req.headers.authorization,
              clientid: req.spaceId.toString()
            }
          };
          console.log(config);
          axios(config)
            .then(function (response) {
              if (response.data && response.data.length > 0) {
                //contact exists
                output.requests = response.data;
                callback(undefined, response.data);
              } else {
                output.requests = undefined;
                callback(error, undefined);
              }
            })
            .catch(function (error) {
              output.requests = undefined;
              callback(error, undefined);
            });
        }
      };
      async.series(tasks, (err, results) => {
        if (err) {
          res.status(400).send(err);
        } else res.status(201).send(output.requests);
      });
    }
  }
];

exports.submit = [
  // Validate fields
  body("fields.name", "Name is required")
  .not()
  .isEmpty()
  .withMessage("Name is required"),
  body("fields.contact", "Contact is invalid"),
  body("fields.contact.phonenumber", "Phone number is invalid")
  .isMobilePhone("fa-IR")
  .withMessage("Phone number is invalid"),
  body("fields.contact.name", "Contact name is invalid")
  .not()
  .isEmpty()
  .withMessage("Contact name is invalid"),
  //Sanitize fields
  sanitizeBody("fields.contact.phonenumber")
  .trim()
  .escape(),
  sanitizeBody("fields.contact.name")
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
      var contacttype = "5dcaca39fd1893001716ac09";
      // switch (req.spaceId.toString()) {
      //   case "5d26e793375e9b001745e84d":
      //     contacttype = "5dc272d251b8310017540c51";
      //     break;
      //   case "5cf3883dcce4de00174d48cf":
      //     contacttype = "5dcaca39fd1893001716ac09";
      //     break;
      // }
      var output = {};
      var tasks = {
        contact: function (callback) {
          ///First query to get existing contact
          var apiRoot =
            process.env.CONTENT_DELIVERY_API ||
            "https://app-dpanel.herokuapp.com";
          var config = {
            url: "/contents/query",
            baseURL: apiRoot,
            method: "get",
            params: {
              contentType: contacttype,
              "fields.phonenumber": req.body.fields.contact.phonenumber,
              "sys.spaceId": req.spaceId.toString()
            },
            headers: {
              authorization: req.headers.authorization,
              clientid: req.spaceId.toString()
            }
          };
          console.log(config);
          axios(config)
            .then(function (response) {
              if (response.data && response.data.length > 0) {
                //contact exists
                output.contact = response.data[0];
                callback(undefined, response.data[0]);
              } else {
                //create new contact

                var fields = req.body.fields.contact;
                var data = {};
                data.fields = fields;
                data["contentType"] = contacttype;
                broker
                  .sendRPCMessage({
                      body: data,
                      userId: req.userId,
                      spaceId: req.spaceId
                    },
                    "addcontent"
                  )
                  .then(result => {
                    var obj = JSON.parse(result.toString("utf8"));
                    if (!obj.success) {
                      if (obj.error) {
                        output.contact = undefined;
                        callback(obj, undefined);
                      }
                    } else {
                      //do mach making and submit to partners
                      output.contact = obj.data;
                      callback(undefined, obj.data);
                    }
                  });
              }
            })
            .catch(function (error) {
              output.contact = undefined;
              callback(error, undefined);
            });
        },
        details: function (callback) {
          var fields = req.body.fields.details;
          var data = {};
          fields.name = req.body.fields.name;
          data.fields = fields;
          data["contentType"] = req.body.contentType;
          broker
            .sendRPCMessage({
                body: data,
                userId: req.userId,
                spaceId: req.spaceId
              },
              "addcontent"
            )
            .then(result => {
              var obj = JSON.parse(result.toString("utf8"));
              if (!obj.success) {
                if (obj.error) {
                  output.details = undefined;
                  callback(obj);
                }
              } else {
                //do mach making and submit to partners
                output.details = obj.data;
                callback(undefined, obj.data);
              }
            });
        },
        request: function (callback) {
          var data = {};
          if (output.details && output.contact) {
            var fields = {
              name: req.body.fields.name,
              contact: output.contact._id,
              details: output.details._id,
              stage: req.body.fields.stage,
              src: req.body.fields.src
            };
            var ctype = "5dc0429a93259a00177dacd4";
            var stage = "5d3fc2d57029a500172c5c3c";
            switch (req.spaceId.toString()) {
              case "5d26e793375e9b001745e84d":
                ctype = "5dc0429a93259a00177dacd4";
                stage = "5d3fc2d57029a500172c5c3c";
                break;
              case "5cf3883dcce4de00174d48cf":
                ctype = "";
                stage = "";
                break;
            }
            data.contentType = ctype;
            fields.stage = stage;
            data.fields = fields;
            broker
              .sendRPCMessage({
                  body: data,
                  userId: req.userId,
                  spaceId: req.spaceId
                },
                "addcontent"
              )
              .then(result => {
                var obj = JSON.parse(result.toString("utf8"));
                if (!obj.success) {
                  if (obj.error) {
                    callback(obj.error);
                  }
                } else {
                  //do mach making and submit to partners
                  output.request = obj.data;
                  callback(undefined, obj.data);
                }
              });
          }
        }
      };
      async.series(tasks, (err, results) => {
        if (err) {
          res.status(400).send(err);
        } else res.status(201).send(output.request);
      });
    }
  }
];

exports.getRequestsOffers = [
  (req, res, next) => {
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
        if (response.data && response.data.length > 0) {
          for (i = 0; i <= response.data.length; i++) {
            if (response.data[i]) {
              response.data[i].fields.requestid.phonenumber = undefined;
              response.data[i].fields.requestid.fullname = undefined;
              response.data[i].fields.requestid.email = undefined;
              response.data[i].fields.requestid.resume = undefined;
              response.data[i].fields.requestid.avatar = undefined;
              response.data[i].fields.partnerid = undefined;
            }
          }
        }
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

exports.getOpenedApplications = [
  (req, res, next) => {
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