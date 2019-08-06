
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Schema definitions.
 */

module.exports = mongoose.model('Tokens', new Schema({
  accessToken: { type: String },
  accessTokenExpiresOn: { type: Date },
  clientId: { type: String },
  refreshToken: { type: String },
  refreshTokenExpiresOn: { type: Date },
  userId: { type: String },
  authenticated : {type : Boolean},
  activation_code : {type : Number},
  deviceToken : {type : String}
}));