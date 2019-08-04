var jwt = require('jsonwebtoken');
const config = require('../config');

function loadHeaders(req, res, next) {
  req.clientId = req.headers.clientid;
  next();
}
function verifyToken(req, res, next) {
    var token = req.headers['authorization'];
    if (token === null || token == undefined)
    {
        token = req.headers['x-access-token'];
        if (!token || token == null)
          return res.status(403).send({ auth: false, message: 'No token provided.' });
          console.log(token)
    }
    if (!token || token == null)
      return res.status(403).send({ auth: false, message: 'No token provided.' });
      token = token.replace("Bearer ", "");
    
      jwt.verify(token, config.secret, function(err, decoded) {
      if (err)
      return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });
      // if everything good, save to request for use in other routes
      req.userId = decoded.id;
      req.clientId = req.headers.clientid;
      console.log("auth : " + JSON.stringify(decoded));
      next();
    });
}

 exports.loadHeaders = loadHeaders;
 exports.verifyToken = verifyToken;
