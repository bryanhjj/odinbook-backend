var express = require('express');
var router = express.Router();

const passport = require("passport");
const jwtStrategy = require("../strategies/jwt");
const facebookTokenStrategy = require("../strategies/facebookToken");

passport.use(jwtStrategy);
passport.use(facebookTokenStrategy);

const authRouter = require('./auth');
const userRouter = require('./users');
const postRouter = require('./posts');

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/posts', postRouter);

module.exports = router;