import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,          // smtp-relay.brevo.com
  port: Number(process.env.SMTP_PORT),  // 587
  secure: false,
  auth: {
    user: process.env.SMTP_USER,        // 9af26b001@smtp-brevo.com
    pass: process.env.BREVO_SMTP_KEY    // SMTP key
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000
});

/* ✅ VERIFY SMTP PROPERLY */
transporter.verify()
  .then(() => {
    console.log("SMTP ready");
  })
  .catch((err) => {
    console.error("SMTP verify failed:", err);
  });

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
});
