var axios = require("axios");
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