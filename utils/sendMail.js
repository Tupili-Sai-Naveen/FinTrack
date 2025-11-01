const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, html) {
  try {
    const data = await resend.emails.send({
      from: "FinTrack <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("✅ Mail sent:", data.id || to);
  } catch (err) {
    console.error("❌ Error sending mail:", err.message);
  }
}

module.exports = sendMail;
