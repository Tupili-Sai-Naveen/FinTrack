const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { spawn } = require("child_process");

// 📊 Analytics Page — with Month Filter + Prediction
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId });

    // 🗓️ Get selected month and year from query (default: current)
    const now = new Date();
    const selectedMonth = parseInt(req.query.month) || now.getMonth(); // 0-11
    const selectedYear = parseInt(req.query.year) || now.getFullYear();

    // 📅 Filter only transactions for selected month/year
    const filteredTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // 💰 Calculate totals
    const totalIncome = filteredTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const categoryBreakdown = {};
    filteredTxns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryBreakdown[t.category] =
          (categoryBreakdown[t.category] || 0) + t.amount;
      });

    // 🔮 Python-based next-month prediction (still uses full history)
    const pythonPrediction = await new Promise((resolve) => {
      let result = "";
      let errorData = "";
      const py = spawn("python", ["./predictor/predict_expense.py"]);
      py.stdin.write(JSON.stringify(transactions)); // all transactions → trend
      py.stdin.end();

      py.stdout.on("data", (data) => (result += data.toString()));
      py.stderr.on("data", (data) => (errorData += data.toString()));

      py.on("close", () => {
        if (errorData) {
          console.error("Python error:", errorData);
          return resolve({ prediction: 0, growth: 0 });
        }
        try {
          const output = JSON.parse(result);
          resolve(output);
        } catch {
          console.error("Prediction parse error");
          resolve({ prediction: 0, growth: 0 });
        }
      });
    });

    // 🗓️ Generate list of available months from data
    const monthsAvailable = [...new Set(transactions.map((t) => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }))].map((m) => {
      const [year, month] = m.split("-").map(Number);
      const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
      return { year, month, label: `${monthName} ${year}` };
    }).sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year));

    // ✅ Render EJS
    res.render("analytics", {
      transactions: filteredTxns,
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown,
      prediction: pythonPrediction.prediction,
      growth: pythonPrediction.growth,
      selectedMonth,
      selectedYear,
      monthsAvailable,
    });
  } catch (err) {
    console.error("Error in analytics:", err);
    res.send("Something went wrong");
  }
});

module.exports = router;
