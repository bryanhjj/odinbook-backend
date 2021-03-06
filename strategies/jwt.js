var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;

var User = require("../models/user");

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_WORD;

/*
opts.jsonWebTokenOptions = {
  complete: false,
  clockTolerance: '',
  maxAge: '2d',
  clockTimestamp: '100',
  nonce: 'string here for OpenID',
}
*/
// opts.issuer = "accounts.examplesoft.com";
// opts.audience = "yoursite.net";

module.exports = new JwtStrategy(opts, function (jwt_payload, done) {
  User.findOne({ _id: jwt_payload.id }, function (err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  });
});