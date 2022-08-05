var express = require("express");
var app = express();

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  };

// use res.render to load up an ejs view file
// index page
app.get("/", isLoggedIn, function (req, res) {
  res.render("index",  {title : "Home", layout : "layouts/main"});
});

module.exports = app;
