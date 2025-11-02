// utils/sendMail.js
const nodemailer = require("nodemailer");

async function sendMail(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"FinTrack Reports" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Mail sent to: ${to}`);
  } catch (err) {
    console.error("❌ Error sending mail:", err.message);
  }
}

module.exports = sendMail;

