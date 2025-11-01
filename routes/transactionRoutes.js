const express = require('express');
const router = express.Router();
const Loan = require("../models/Loan");
const Transaction = require('../models/Transaction');
const Bill = require("../models/Bill"); // ✅ import bills

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// 🏠 Dashboard
router.get("/dashboard", isLoggedIn, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
  const loans = await Loan.find({ user: req.user._id });
  const bills = await Bill.find({ user: req.user._id, status: "pending" }).sort({ dueDate: 1 });

  // Show only next 3 upcoming bills
  const upcomingBills = bills.filter(bill => {
    const today = new Date();
    return new Date(bill.dueDate) >= today;
  }).slice(0, 3);

  res.render("dashboard", {
    user: req.user,
    transactions,
    loans,
    upcomingBills
  });
});

// ➕ Add transaction form
router.get('/add', isLoggedIn, (req, res) => {
  res.render('addTransaction', { user: req.user });
});

// ➕ Add transaction logic
router.post('/add', isLoggedIn, async (req, res) => {
  const { type, category, amount, note } = req.body;
  await Transaction.create({
    user: req.user._id,
    type,
    category,
    amount,
    note,
  });
  res.redirect('/dashboard');
});

// 🗑️ Delete transaction
router.post('/delete/:id', isLoggedIn, async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.redirect('/dashboard');
});

module.exports = router;
