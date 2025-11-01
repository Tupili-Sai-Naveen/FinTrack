// utils/monthlyReport.js
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { spawn } = require("child_process");
const sendMail = require("./sendMail");

async function sendMonthlyReport() {
  try {
    const users = await User.find({});

    for (const user of users) {
      const transactions = await Transaction.find({ user: user._id });
      if (!transactions.length) continue;

      // 🧮 Income & Expense calculation
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;

      // 🏷️ Top categories
      const categoryTotals = {};
      transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          categoryTotals[t.category] =
            (categoryTotals[t.category] || 0) + t.amount;
        });

      const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: ₹${amt}`)
        .join("<br>") || "—";

      // 🧠 Run Python predictor
      const pythonOutput = await new Promise((resolve) => {
        let result = "";
        let errorData = "";

        const py = spawn("python", ["./predictor/predict_expense.py"]);
        py.stdin.write(JSON.stringify(transactions));
        py.stdin.end();

        py.stdout.on("data", (data) => (result += data.toString()));
        py.stderr.on("data", (data) => (errorData += data.toString()));

        py.on("close", () => {
          if (errorData) {
            console.error("Python error:", errorData);
            return resolve({ prediction: 0, growth: 0 });
          }
          try {
            const parsed = JSON.parse(result);
            resolve(parsed);
          } catch (err) {
            console.error("Parse error from Python:", err);
            console.log("Raw Python output:", result);
            resolve({ prediction: 0, growth: 0 });
          }
        });
      });

      const { prediction, growth } = pythonOutput;

      // 📧 Create Email HTML
      const html = `
        <h2>📊 FinTrack Monthly Report</h2>
        <p>Hi <b>${user.username}</b>, here’s your monthly summary:</p>
        <ul>
          <li><b>Total Income:</b> ₹${totalIncome}</li>
          <li><b>Total Expense:</b> ₹${totalExpense}</li>
          <li><b>Net Balance:</b> ₹${balance}</li>
        </ul>
        <p><b>Top Expense Categories:</b><br>${topCategories}</p>
        <hr>
        <h3>📈 Next Month Prediction</h3>
        <p>Predicted Expense: ₹${prediction}</p>
        <p>
          ${
            growth > 0
              ? `Expected increase of ${growth}% 🔺`
              : growth < 0
              ? `Expected decrease of ${Math.abs(growth)}% 🔻`
              : "No change expected."
          }
        </p>
        <hr>
        <p style="color:green"><b>Keep saving smart with FinTrack 💰</b></p>
      `;

      // 📤 Send via Resend
      await sendMail(
        user.email,
        "📊 FinTrack Monthly Summary & Prediction",
        html
      );

      console.log(`✅ Report sent to ${user.email}`);
    }

    console.log("🎉 All monthly reports sent!");
  } catch (err) {
    console.error("❌ Error sending reports:", err);
  }
}

module.exports = sendMonthlyReport;
