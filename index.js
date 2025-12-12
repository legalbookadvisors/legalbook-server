import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Allow frontend to call this API
app.use(cors({
  origin: "*",
}));

app.use(express.json({ limit: "10mb" }));

// Microsoft 365 SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
  
});

// Email API route
app.post("/api/send-email", async (req, res) => {
  try {
    const { name, email, phone, totalScore, category, sectionScores } = req.body;

    await transporter.sendMail({
      from: process.env.MAIL_USER,
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
  console.log(`Mail server running on port ${PORT}`);
});
