const mongoose = require("mongoose");

const savingGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  principal: Number,
  rate: Number,
  time: Number, // years
  type: String, // simple or compound
  result: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SavingGoal", savingGoalSchema);
