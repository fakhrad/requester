var axios = require("axios");
const Contents = require("../models/content");
const ContentTypes = require("../models/contentType");
const mongoose = require('mongoose')
const helper = require('./helper')
const async = require('async')

exports.getcontentsbytype = [
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
          '", status:"published"){ fields, _id, sys{issuer issueDate} }  }'
      },
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(JSON.stringify(config));
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
  // (req, res, next) => {
  //   var q = req.query || {};
  //   if (q) {
  //     q["sys.spaceId"] = req.spaceId.toString();
  //     q["status"] = "published";
  //     q["contentType"] = req.params.contentType;
  //     q["loadrelations"] = false;
  //   }
  //   console.log(q);
  //   var apiRoot =
  //     process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
  //   var config = {
  //     url: "/contents/query",
  //     baseURL: apiRoot,
  //     method: "get",
  //     params: q,
  //     headers: {
  //       authorization: req.headers.authorization,
  //       clientid: req.spaceId.toString()
  //     }
  //   };
  //   console.log(config);
  //   axios(config)
  //     .then(function(response) {
  //       res.send(response.data);
  //     })
  //     .catch(function(error) {
  //       if (error.response) {
  //         // The request was made and the server responded with a status code
  //         // that falls out of the range of 2xx
  //         console.log(error.response.data);
  //         console.log(error.response.status);
  //         console.log(error.response.headers);
  //         res.status(error.response.status).send(error.response.data);
  //       } else if (error.request) {
  //         // The request was made but no response was received
  //         // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
  //         // http.ClientRequest in node.js
  //         console.log(error.request);
  //         res.status(204).send("No response from server");
  //       } else {
  //         // Something happened in setting up the request that triggered an Error
  //         console.log("Error", error.message);
  //         res.status(500).send(error.message);
  //       }
  //       console.log(error.config);
  //       res.status(400).send(error.config);
  //     });
  // }
];

function isArray(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
}
var lean = function (content, lang) {
  var r = {};
  var keys = Object.keys(content);
  console.log(keys)
  for (j = 0; j < keys.length; j++) {
    var value = content[keys[j]];
    if (value == undefined)
      r[keys[j]] = undefined;
    else {
      if (lang) {
        if (Array.isArray(value)) {
          console.log("is array");
          var t = [];
          for (l = 0; l < value.length; l++) {
            console.log(value[l])
            if (value[l] != undefined) {
              if (typeof (value[l]) == "object") {
                var v = value[l];
                console.log(v);
                if (v[lang] != undefined) {
                  console.log(v[lang]);
                  if (v[lang].toString().startsWith("http"))
                    t.push(v[lang].toString().replace("https://assets.herokuapp.com", "https://assets.reqter.com").replace("https://app-spanel.herokuapp.com", "https://assets.reqter.com"));
                  else if (v[lang].toString().startsWith("/assets"))
                    t.push("https://assets.reqter.com" + v[lang].toString());
                  else
                    t.push("https://assets.reqter.com/assets/download/" + v[lang].toString());
                } else
                  t.push(v);
              } else
                t.push(value[l]);
            }
          }
          r[keys[j]] = t;
        } else
          if (typeof (value) == "object") {
            if (value[lang] != undefined) {
              if (value[lang].toString().startsWith("http"))
                r[keys[j]] = value[lang].toString().replace("https://assets.herokuapp.com", "https://assets.reqter.com").replace("https://app-spanel.herokuapp.com", "https://assets.reqter.com");
              else if (value[lang].toString().startsWith("/assets"))
                r[keys[j]] = "https://assets.reqter.com" + value[lang].toString();
              else
                r[keys[j]] = "https://assets.reqter.com/assets/download/" + value[lang].toString();
              r[keys[j]] = value[lang];
              console.log(value[lang]);
            } else {
              r[keys[j]] = value;
            }
          } else

            r[keys[j]] = value;
      } else
        r[keys[j]] = value;
    }
  }
  return r;
}
exports.getflatcontentsbytype = [
  (req, res, next) => {
    if (req.query && !req.query.limit) {
      req.query.limit = 500;
      req.query.sort = "-sys.lastUpdateTime"
    }
    var lang = req.query.lang;
    delete req.query.lang;
    req.query.contentType = req.params.contentType
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    req.query["status"] = "published";
    var config = {
      url: "/contents/query",
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
        console.log("we have the response")
        if (response.data && response.data.data && response.data.data.contents) {
          var rows = [];
          console.log(lang);
          for (i = 0; i <= response.data.data.contents.length - 1; i++) {
            var content = response.data.data.contents[i].fields;
            var r = lean(content, lang);
            r["_id"] = response.data.data.contents[i]._id
            rows.push(r);
          }
          res.send(rows);
        } else {
          var rows = [];
          console.log(lang)
          for (i = 0; i <= response.data.length - 1; i++) {
            var content = response.data[i].fields;
            var r = lean(content, lang);
            r["_id"] = response.data[i]._id
            rows.push(r);
          }
          res.send(rows);
        }
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
          Promise.reject(new Error("No response from server"));
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
          Promise.reject(new Error(error.message));
        }
        console.log(error.config);
        Promise.reject(error)
        //res.send(error.config);
      });
  }
];

exports.querycontents = [
  (req, res, next) => {
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/graphql",
      baseURL: apiRoot,
      method: "get",
      params: {
        query: '{contents(contentType : "' +
          req.query.contentTypes +
          '" , status:"published"){ fields, _id, sys{issuer issueDate}, contentType }  }'
      },
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(JSON.stringify(config));
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

exports.fullquery = [
  (req, res, next) => {
    var q = req.query || {};
    if (q) {
      q["sys.spaceId"] = req.spaceId.toString();
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

exports.getAllLean = [
  (req, res, next) => {
    var q = req.query || {};
    if (q) {
      q["sys.spaceId"] = req.spaceId.toString();
    }
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/getall",
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
        console.log("we have the response")
        if (response.data && response.data.data && response.data.data.contents) {
          var rows = [];
          console.log(lang);
          for (i = 0; i <= response.data.data.contents.length - 1; i++) {
            var content = response.data.data.contents[i].fields;
            var r = lean(content, lang);
            r["_id"] = response.data.data.contents[i]._id
            rows.push(r);
          }
          res.send(rows);
        } else {
          console.log(JSON.stringify(response.data))
          var rows = [];
          console.log(lang)
          for (i = 0; i <= response.data.length - 1; i++) {
            var content = response.data[i].fields;
            var r = lean(content, lang);
            r["_id"] = response.data[i]._id
            rows.push(r);
          }
          res.send(rows);
        }
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
  ctype = req.query.contentType
  console.log("spaceId :" + req.spaceId + " userId :" + req.query.id || req.userId)
  var params = {
    "sys.spaceId": req.spaceId,
    contentType: ctype
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
  var sort = req.query ? req.query.sort || "-sys.issueDate" : "-sys.issueDate";
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
            $in: req.body.search[field]
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
            $in: req.body.search[field]
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
        .select("fields _id contentType sys.issueDate status")
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
exports.search = findAll;
exports.getAll = [
  (req, res, next) => {
    var q = req.query || {};
    if (q) {
      q["spaceId"] = req.spaceId.toString();
    }
    console.log(q);
    var apiRoot =
      process.env.CONTENT_DELIVERY_API || "https://app-dpanel.herokuapp.com";
    var config = {
      url: "/contents/getall",
      baseURL: apiRoot,
      method: "get",
      params: q,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
        clientid: req.spaceId.toString()
      }
    };
    console.log(config);
    axios(config)
      .then(function (response) {
        console.log("we have the response")

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