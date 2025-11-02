// utils/monthlyReport.js
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { spawn } = require("child_process");
const sendMail = require("./sendMail");

// helper to run the Python predictor script
function runPredictor(transactions) {
  return new Promise((resolve) => {
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
        if (!result.trim()) return resolve({ prediction: 0, growth: 0 });
        const parsed = JSON.parse(result);
        resolve(parsed);
      } catch (err) {
        console.error("Parse error from Python:", err);
        console.log("Raw Python output:", result);
        resolve({ prediction: 0, growth: 0 });
      }
    });
  });
}

async function sendMonthlyReport() {
  try {
    const users = await User.find({});

    if (!users || users.length === 0) {
      console.log("No users found for monthly report.");
      return;
    }

    for (const user of users) {
      try {
        const transactions = await Transaction.find({ user: user._id });

        if (!transactions || transactions.length === 0) {
          console.log(`No transactions for user ${user.email}, skipping.`);
          continue;
        }

        // totals
        const totalIncome = transactions
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + (t.amount || 0), 0);

        const totalExpense = transactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + (t.amount || 0), 0);

        const balance = totalIncome - totalExpense;

        // top categories
        const categoryTotals = {};
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            const cat = t.category || "Other";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
          });

        const topCategories = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, amt]) => `${cat}: ₹${amt}`)
          .join("<br>") || "—";

        // predictor (safe)
        const { prediction = 0, growth = 0 } = await runPredictor(transactions);

        // email HTML
        const html = `
          <h2>📊 FinTrack Monthly Report</h2>
          <p>Hi <b>${user.username || user.email}</b>, here’s your monthly summary:</p>
          <ul>
            <li><b>Total Income:</b> ₹${totalIncome}</li>
            <li><b>Total Expense:</b> ₹${totalExpense}</li>
            <li><b>Net Balance:</b> ₹${balance}</li>
          </ul>
          <p><b>Top Expense Categories:</b><br>${topCategories}</p>
          <hr>
          <h3>📈 Next Month Prediction</h3>
          <p>Predicted Expense: ₹${prediction}</p>
          <p>${
            growth > 0
              ? `Expected increase of ${growth}% 🔺`
              : growth < 0
              ? `Expected decrease of ${Math.abs(growth)}% 🔻`
              : "No change expected."
          }</p>
          <hr>
          <p style="color:green"><b>Keep tracking and saving smarter with FinTrack 💰</b></p>
        `;

        // send mail (with retry on temporary failure)
        const maxRetries = 2;
        let attempt = 0;
        let sent = false;
        while (attempt <= maxRetries && !sent) {
          const result = await sendMail(user.email, "📊 Your Monthly FinTrack Summary", html);
          if (result.ok) {
            console.log(`✅ Report sent to ${user.email}`);
            sent = true;
          } else {
            attempt++;
            console.warn(`Retry ${attempt}/${maxRetries} for ${user.email} after error:`, result.error && result.error.message ? result.error.message : result.error);
            // small delay before retry
            await new Promise((r) => setTimeout(r, 2000 * attempt));
          }
        }

        if (!sent) {
          console.error(`❌ Failed to send monthly report to ${user.email} after ${maxRetries + 1} attempts.`);
        }
      } catch (userErr) {
        console.error("Error while processing user report:", userErr);
      }
    }
    console.log("🎉 Monthly reports job finished.");
  } catch (err) {
    console.error("❌ Error in sendMonthlyReport:", err);
  }
}

module.exports = sendMonthlyReport;
