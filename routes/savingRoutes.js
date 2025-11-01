const express = require("express");
const router = express.Router();
const SavingGoal = require("../models/SavingGoal");

// ✅ Middleware to check login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// Show all saved goals
router.get("/", isLoggedIn, async (req, res) => {
  const goals = await SavingGoal.find({ user: req.user._id });
  res.render("savings", { goals });
});

// Calculator form
router.get("/calculator", isLoggedIn, (req, res) => {
  res.render("savingsCalculator");
});

// Handle calculation
router.post("/calculate", isLoggedIn, async (req, res) => {
  const { principal, rate, time, type } = req.body;
  let result;

  const p = parseFloat(principal);
  const r = parseFloat(rate);
  const t = parseFloat(time);

  if (type === "simple") {
    result = p + (p * r * t) / 100;
  } else {
    result = p * Math.pow(1 + r / 100, t);
  }

  await SavingGoal.create({
    user: req.user._id,
    principal: p,
    rate: r,
    time: t,
    type,
    result,
  });

  res.redirect("/savings");
});

module.exports = router;
