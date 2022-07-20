var express = require("express");
var router = express.Router();
const facebookTokenStrategy = require("../strategies/facebookToken");
const { check, body, validationResult } = require("express-validator");
var User = require("../models/user");
const passport = require("passport");
passport.use(facebookTokenStrategy);
const { issueJWT, validatePassword } = require('../utils/bcrypt');
const user_controller = require('../controllers/userController');

// facebook login
router.post(
  "/facebook/token",
  passport.authenticate("facebook-token"),
  (req, res) => {
    res.status(201).json({
      message: "FB Auth successful",
      user: {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email,
        id: req.user._id,
        profilePicUrl: req.user.profilePicUrl ? req.user.profilePicUrl : "",
        facebookId: req.user.facebookId,
      },
    });
  }
);

// Create a new user
router.post('/register', user_controller.user_create);

// POST login
router.post("/login",

  // Validate user input before sending the POST login req
  body('username', 'Username required').trim().isLength({ min: 1 }).escape(),
  body('password', 'Password required').trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const { username, password } = req.body;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    try {
      const foundUser = await User.findOne({username}).select("+password");
      if (foundUser) {
        // returns as <Pending> if we don't await here
        const passwordMatch = await validatePassword(password, foundUser);
        if (passwordMatch) {
          const tokenObj = issueJWT(foundUser);

          return res.status(200).json({
            message: "Log in successful",
            token: tokenObj,
            user: {
              first_name: foundUser.first_name,
              last_name: foundUser.last_name,
              username: foundUser.username,
              email: foundUser.email,
              id: foundUser._id,
              profile_pic: foundUser.profile_pic ? foundUser.profile_pic : "",
            },
          });
        } else {
          res.status(401).json({ message: "Incorrect password" });
        }
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;