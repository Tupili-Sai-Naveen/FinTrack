const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const Transaction = require("../models/Transaction");

// Predict next month's expenses
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId });

    // If no transactions → return early
    if (!transactions.length) {
      return res.render("prediction", { prediction: 0, growth: 0 });
    }

    const py = spawn("python", ["./predictor/predict_expense.py"]);
    py.stdin.write(JSON.stringify(transactions));
    py.stdin.end();

    let result = "";
    let errorData = "";

    py.stdout.on("data", (data) => (result += data.toString()));
    py.stderr.on("data", (data) => (errorData += data.toString()));

    py.on("close", (code) => {
      if (errorData) {
        console.error("Python error:", errorData);
        return res.render("prediction", { prediction: 0, growth: 0 });
      }

      try {
        if (!result.trim()) throw new Error("Empty Python output");
        const output = JSON.parse(result);
        res.render("prediction", {
          prediction: output.prediction,
          growth: output.growth,
        });
      } catch (err) {
        console.error("Error parsing prediction:", err);
        console.log("Raw Python output:", result);
        res.render("prediction", { prediction: 0, growth: 0 });
      }
    });
  } catch (err) {
    console.error("Server error:", err);
    res.render("prediction", { prediction: 0, growth: 0 });
  }
});

module.exports = router;
