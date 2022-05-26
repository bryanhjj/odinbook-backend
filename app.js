require("dotenv").config();
var cors = require("cors");
var bodyParser = require("body-parser"); // maybe remove?
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require("passport");

var indexRouter = require('./routes/index');

var app = express();
app.use(cookieParser());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, "public")));

app.use('/', indexRouter);

module.exports = app;