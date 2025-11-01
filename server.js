require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const cron = require("node-cron");
const sendMonthlyReport = require("./utils/monthlyReport");
const loanRoutes = require("./routes/loanRoutes");
const savingRoutes = require("./routes/savingRoutes");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const predictRoutes = require("./routes/predictRoutes");
const billRoutes = require("./routes/billRoutes");
const sendBillReminders = require("./utils/billReminder");


require("./config/passportConfig");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: "fintracksecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Flash + Passport setup
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// Routes
app.use("/", authRoutes);
app.use("/", transactionRoutes);
app.use("/loans", loanRoutes);
app.use("/savings", savingRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/predict", predictRoutes);
app.use("/bills", billRoutes);



app.get("/", (req, res) => {
  res.render("index");
});

// Authentication middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// 🕒 Schedule monthly report every 1st day at 9:00 AM
cron.schedule("0 9 1 * *", async () => {
  console.log("📬 Running monthly report job...");
  await sendMonthlyReport();
});

cron.schedule("0 9 * * *", async () => {
  console.log("📬 Running daily bill reminder job...");
  await sendBillReminders();
});

// ✅ Manual trigger route for testing
app.get("/test-report", async (req, res) => {
  console.log("🧪 Sending test monthly report...");
  await sendMonthlyReport();
  res.send("✅ Test email report sent!");
});

app.get("/test-bill-reminder", async (req, res) => {
  await sendBillReminders();
  res.send("✅ Test reminder emails sent!");
});
