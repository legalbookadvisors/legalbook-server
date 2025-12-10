import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create app FIRST
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "10mb" }));

// Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Route
app.post("/api/send-email", async (req, res) => {
  try {
    const { name, email, phone, totalScore, category, sectionScores } = req.body;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "sales@legalbook.io",
      subject: "New Audit Submission",
      html: `
        <h2>New Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>

        <hr/>

        <h3>Audit Details</h3>
        <p><strong>Total Score:</strong> ${totalScore}</p>
        <p><strong>Category:</strong> ${category}</p>

        <h4>Section Scores:</h4>
        <pre>${JSON.stringify(sectionScores, null, 2)}</pre>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Mail server running on port", PORT);
});
