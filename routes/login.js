var express = require("express");
var app = express();
let router = express.Router();
const localStrategy = require("passport-local").Strategy;
const passport = require("passport");


// use res.render to load up an ejs view file
// index page
app.get("/", function (req, res) {
  res.render("login", { title: "Login", layout: "layouts/main" });
});

module.exports = app;
