const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");

// ✅ Authentication middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// 📋 Show all bills
router.get("/", isLoggedIn, async (req, res) => {
  const bills = await Bill.find({ user: req.user._id }).sort({ dueDate: 1 });
  res.render("bills", { bills });
});

// ➕ Add new bill form
router.get("/add", isLoggedIn, (req, res) => {
  res.render("addBill");
});

// 📨 Handle form submit
router.post("/add", isLoggedIn, async (req, res) => {
  const { name, amount, dueDate } = req.body;
  await Bill.create({
    user: req.user._id,
    name,
    amount,
    dueDate,
  });
  res.redirect("/bills");
});

// ✅ Mark bill as paid
router.post("/:id/markPaid", isLoggedIn, async (req, res) => {
  await Bill.findByIdAndUpdate(req.params.id, { status: "paid" });
  res.redirect("/bills");
});

// 🗑️ Delete a bill
router.post("/:id/delete", isLoggedIn, async (req, res) => {
  await Bill.findByIdAndDelete(req.params.id);
  res.redirect("/bills");
});

module.exports = router;
