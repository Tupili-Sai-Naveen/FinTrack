const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  amount: Number,
  dueDate: Date,
  status: { type: String, default: "pending" },
});

module.exports = mongoose.model("Bill", billSchema);
