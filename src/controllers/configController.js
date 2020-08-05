const Spaces = require("../models/space");

var _getlocales = function (req, res, next) {
  console.log(req.spaceId)
  Spaces.findById(req.spaceId).exec((err, space) => {
    var result = {
      success: false,
      message: undefined,
      error: undefined
    };
    if (err) {
      result.error = err;
      res.status(400).send(result);
      return;
    }
    if (space) {
      result.success = true;
      result.data = space.locales
      res.status(200).send(result);
    } else {
      result.error = "Invalid space";
      res.status(500).send(result);
    }
  });
}
exports.getlocales = _getlocales;
