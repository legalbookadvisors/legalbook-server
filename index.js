import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000
});


// /* ✅ VERIFY SMTP PROPERLY */
// transporter.verify()
//   .then(() => {
//     console.log("SMTP ready");
//   })
//   .catch((err) => {
//     console.error("SMTP verify failed:", err);
//   });

/* routes come AFTER verify */
app.post("/api/send-email", async (req, res) => {
  try {
    const { name, email, phone, totalScore, category, sectionScores } = req.body;

    await transporter.sendMail({
      from: '"Legalbook" <no-reply@radhikakabbade.com>',
      to: "sales@legalbook.io",
      subject: "New Audit Submission",
      html: `...`
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Mail server running");
  console.log("SMTP_USER:", process.env.SMTP_USER ? "✓ Loaded" : "✗ Missing");
  console.log("SMTP_PASS:", process.env.SMTP_PASS ? "✓ Loaded" : "✗ Missing");
});
