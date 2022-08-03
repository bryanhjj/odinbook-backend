require("dotenv").config();
require("./utils/mongoConfig");
var cors = require("cors");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require("passport");
var session = require("express-session");

var indexRouter = require('./routes/index');

var app = express();

// to update cors accordingly
app.use(cors({
    origin: 'https://bryanhjj.github.io',
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// to show "route not available" if users try to access a route that doesn't exits.
app.use("*", (req, res) => res.status(404).json({error: "route not available."}));

module.exports = app;
