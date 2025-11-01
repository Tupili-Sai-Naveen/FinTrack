const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const router = express.Router();
const sendMail = require("../utils/sendMail");

// Register Page
router.get("/register", (req, res) => {
  res.render("register", { message: req.flash("error") });
});

// Register Logic
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    await User.register(user, password);

    // ✅ Send welcome email
    const html = `
      <h2>Welcome to FinTrack, ${username}! 🎉</h2>
      <p>Your account has been created successfully.</p>
      <p>Now you can track your expenses, savings, and loans all in one place!</p>
      <hr>
      <p>Login here: <a href="http://localhost:3000/login">FinTrack Login</a></p>
    `;
    await sendMail(email, "🎉 Welcome to FinTrack!", html);

    res.redirect("/login");
  } catch (err) {
    req.flash("error", "Username already exists or invalid input!");
    res.redirect("/register");
  }
});

// Login Page
router.get("/login", (req, res) => {
  res.render("login", { message: req.flash("error") });
});

// Login Logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

module.exports = router;
