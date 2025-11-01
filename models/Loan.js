const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  person: String, // Who gave/took loan
  amount: Number,
  interestRate: Number,
  startDate: Date,
  dueDate: Date,
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
});

module.exports = mongoose.model("Loan", loanSchema);
