const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 587,
  secure: false,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"FinTrack" <noreply@resend.dev>`,
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

