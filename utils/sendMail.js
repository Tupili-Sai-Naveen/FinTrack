const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"FinTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Mail sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending mail:", err);
  }
}

module.exports = sendMail;
