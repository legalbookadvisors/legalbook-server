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
  secure: false,
  auth: {
    user: "9af26b001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY
  }
});

/* 👇 ADD IT EXACTLY HERE */
transporter.verify()
  .then(() => console.log("SMTP ready"))
  .catch(err => console.error("SMTP verify failed", err));

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
