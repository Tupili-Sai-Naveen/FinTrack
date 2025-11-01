
const express = require("express");
const router = express.Router();
const Loan = require("../models/Loan");

// ✅ Middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// Show all loans
router.get("/", isLoggedIn, async (req, res) => {
  const loans = await Loan.find({ user: req.user._id });
  res.render("loans", { loans });
});

// Add loan form
router.get("/add", isLoggedIn, (req, res) => {
  res.render("addLoan");
});

// Handle loan submission
router.post("/add", isLoggedIn, async (req, res) => {
  const { person, amount, interestRate, startDate, dueDate } = req.body;
  await Loan.create({
    user: req.user._id,
    person,
    amount,
    interestRate,
    startDate,
    dueDate,
  });
  res.redirect("/loans");
});

// Mark as paid
router.post("/:id/markPaid", isLoggedIn, async (req, res) => {
  await Loan.findByIdAndUpdate(req.params.id, { status: "paid" });
  res.redirect("/loans");
});

// Delete loan
router.post("/:id/delete", isLoggedIn, async (req, res) => {
  await Loan.findByIdAndDelete(req.params.id);
  res.redirect("/loans");
});

module.exports = router;
