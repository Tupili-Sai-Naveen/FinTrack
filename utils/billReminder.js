const nodemailer = require("nodemailer");
const Bill = require("../models/Bill");
const User = require("../models/User");

async function sendBillReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    const billsDue = await Bill.find({
      dueDate: { $gte: start, $lte: end },
      status: "pending",
    }).populate("user");

    if (!billsDue.length) {
      console.log("✅ No bills due tomorrow.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const bill of billsDue) {
      const html = `
        <h3>⏰ Reminder: Upcoming Bill Due Tomorrow!</h3>
        <p>Hi ${bill.user.username},</p>
        <p>Your <b>${bill.name}</b> bill of <b>₹${bill.amount}</b> is due on 
        <b>${new Date(bill.dueDate).toDateString()}</b>.</p>
        <p>Please make sure to pay on time to avoid penalties 💸</p>
        <hr>
        <p>— FinTrack Smart Reminder System 💰</p>
      `;

      await transporter.sendMail({
        from: `"FinTrack Reminder" <${process.env.EMAIL_USER}>`,
        to: bill.user.email,
        subject: "🔔 Bill Due Tomorrow - FinTrack Reminder",
        html,
      });

      console.log(`📧 Reminder sent to ${bill.user.email} for ${bill.name}`);
    }
  } catch (err) {
    console.error("❌ Error sending reminders:", err);
  }
}

module.exports = sendBillReminders;
