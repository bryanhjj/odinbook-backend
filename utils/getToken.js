const jwt = require("jsonwebtoken");
const ExtractJwt = require("passport-jwt").ExtractJwt;

const getToken = (req, res, next) => {
  if (!req.user) {
    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    const payload = jwt.verify(jwtFromRequest(req), process.env.JWT_WORD);
    req.payload = payload;
  } else {
    req.payload = req.user;
  }

  next();
};

module.exports = getToken;