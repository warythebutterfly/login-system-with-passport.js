const express = require("express");
const session = require("express-session");
const pool = require("./db");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
require("dotenv").config();
const app = express();

// set the view engine to hbs
app.set("view engine", "hbs");
app.engine("hbs", require("hbs").__express);

//serve static files
app.use(express.static(__dirname + "/public"));

app.use(
  session({
    secret: "verygoodsecret",
    resave: false,
    saveUninitialized: true,
  })
);

//allows express to pass data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Passport.js
//you always need to initialize
app.use(passport.initialize());

//we want session
app.use(passport.session());

//when we login we serialize and deserialize user
//weserialize the user into a request
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    //if we need the user details we deserialize the user, find the user by id and pass back the user
    const user = await pool.query("select * from users where id = $1", [id]);
    done(null, user.rows[0]);
  } catch (error) {
    console.log(error.message);
  }
});

//set up strategy
passport.use(
  new localStrategy(async (username, password, done) => {
    try {
      const user = await pool.query("select * from users where username = $1", [
        username.toLowerCase(),
      ]);

      if (user.rowCount === 0)
        return done(null, false, { message: "Incorrect username." });

      const pass = user.rows[0].password;

      //we need to compare our password with our hash
      bcrypt.compare(password, pass, (err, res) => {
        if (err) return done(err);

        //passwords do not match
        if (res === false)
          return done(null, false, { message: "Incorrect password." });

        return done(null, user.rows[0]);
      });
    } catch (error) {
      console.log(error.message);
    }
  })
);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

function isLoggedOut(req, res, next) {
  if (!req.isAuthenticated()) return next();
  res.redirect("/");
}

app.get("/", isLoggedIn, function (req, res) {
  res.render("index", { title: "Login", layout: "layouts/main" });
});

app.get("/login", isLoggedOut, function (req, res) {
  const response = {
    title: "Login",
    layout: "layouts/main",
    error: req.query.error,
  };
  res.render("login", response);
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login?error=true",
  })
);

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

//setup our admin user
app.get("/setup", async (req, res) => {
  console.log(process.env.DATABASE_NAME);
  const admin = "admin";
  try {
    const exists = await pool.query(
      "SELECT (username) FROM users WHERE EXISTS (SELECT username FROM users WHERE username = 'admin')"
    );

    if (exists.rowCount) {
      console.log("exists");
      res.redirect("/login");
      return;
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) return next(err);
      bcrypt.hash("password", salt, async (err, hash) => {
        if (err) return next(err);
        await pool.query(
          "insert into users (username, password) values ('admin', $1)",
          [hash]
        );

        res.redirect("/login");
      });
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(3000, () => {
  "Server is running on port 3000";
});
