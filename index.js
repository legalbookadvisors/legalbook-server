import express from "express";
import cors from "cors";
import axios from "axios"; // ADD THIS LINE
import dotenv from "dotenv";

dotenv.config();
// DEBUG: List ALL environment variables (remove after testing)
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("PORT:", process.env.PORT);
console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "SET (first 10 chars): " + process.env.BREVO_API_KEY.substring(0, 10) + "..." : "NOT SET");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("SMTP_USER:", process.env.SMTP_USER || "NOT SET");
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "SET (hidden)" : "NOT SET");
console.log("=============================");

const app = express();

const allowedOrigins = [
  // Production URLs
  "https://legalbook.io",
  "https://www.legalbook.io",
  "https://legalbookadvisors.radhikakabbade.com",
  "http://legalbookadvisors.radhikakabbade.com",
  
  // Development URLs
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  
  // Render preview URLs (if any)
  "https://legalbook-server.onrender.com",
  
  // For testing
  "https://reqbin.com",
  "https://hoppscotch.io"
];
// TEMPORARY FIX - Remove after testing
app.use(cors({ origin: "*" }));
console.log("⚠️ WARNING: CORS is open to ALL origins");

// Handle pre-flight requests
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: ${origin} not allowed`;
      console.log("CORS blocked:", origin);
      return callback(new Error(msg), false);
    }
    
    console.log("CORS allowed:", origin);
    return callback(null, true);
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "10mb" }));

// Health check endpoint for Render monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    service: "legalbook-email-api",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Legalbook Email API Server is running");
});

// Main email endpoint using Brevo API v3
app.post("/api/send-email", async (req, res) => {
  try {
    console.log("Received email request:", new Date().toISOString());
    
    const { name, email, phone, totalScore, category, sectionScores, company } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: "Missing required fields: name, email, phone" 
      });
    }

    // Prepare the email payload for Brevo API
    const emailData = {
      sender: {
        name: "Legalbook",
        email: "no-reply@radhikakabbade.com" // Must be verified in Brevo
      },
      to: [
        {
          email: "sales@legalbook.io",
          name: "Legalbook Sales Team"
        }
      ],
      subject: "New Audit Submission - Legalbook Assessment",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 12px; }
            .label { font-weight: bold; color: #4b5563; }
            .score-box { 
              background: white; 
              padding: 15px; 
              border-radius: 6px; 
              border-left: 4px solid #2563eb;
              margin: 15px 0;
            }
            .section-scores { 
              background: white; 
              padding: 15px; 
              border-radius: 6px; 
              margin-top: 10px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📋 New Legal Health Assessment Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">👤 Name:</span> ${name}
              </div>
              ${company ? `<div class="field"><span class="label">🏢 Company:</span> ${company}</div>` : ''}
              <div class="field">
                <span class="label">📧 Email:</span> ${email}
              </div>
              <div class="field">
                <span class="label">📱 Phone:</span> ${phone}
              </div>
              
              <div class="score-box">
                <div class="field">
                  <span class="label">🏆 Total Score:</span> ${totalScore}/30
                </div>
                <div class="field">
                  <span class="label">📊 Category:</span> <strong>${category}</strong>
                </div>
              </div>
              
              <div class="field">
                <span class="label">📈 Section Scores:</span>
                <div class="section-scores">
                  ${Object.entries(sectionScores || {})
                    .map(([section, score]) => 
                      `<div>• ${section.charAt(0).toUpperCase() + section.slice(1)}: ${score}/5</div>`
                    ).join('')}
                </div>
              </div>
              
              <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <small>🕒 Submitted at: ${new Date().toLocaleString()}</small>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Optional: Add text version for email clients that don't support HTML
      textContent: `
        New Audit Submission
        --------------------
        Name: ${name}
        ${company ? `Company: ${company}` : ''}
        Email: ${email}
        Phone: ${phone}
        Total Score: ${totalScore}/30
        Category: ${category}
        
        Section Scores:
        ${Object.entries(sectionScores || {})
          .map(([section, score]) => `  • ${section}: ${score}/5`)
          .join('\n')}
        
        Submitted at: ${new Date().toLocaleString()}
      `
    };

    console.log("Sending to Brevo API...");
    
    // Send email via Brevo API v3
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log("Brevo API response:", response.data);
    
    res.json({ 
      success: true, 
      messageId: response.data.messageId,
      message: "Email sent successfully"
    });
    
  } catch (err) {
    console.error("❌ Email sending error:", {
      timestamp: new Date().toISOString(),
      error: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    
    // Provide helpful error messages
    let errorMessage = "Failed to send email";
    let statusCode = 500;
    
    if (err.response) {
      // Brevo API returned an error
      statusCode = err.response.status;
      errorMessage = err.response.data?.message || `Brevo API error: ${err.response.status}`;
      
      if (err.response.status === 401) {
        errorMessage = "Invalid API key. Please check BREVO_API_KEY.";
      } else if (err.response.status === 400) {
        errorMessage = "Invalid email data. Please check the request format.";
      } else if (err.response.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      }
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = "Request timeout. Please try again.";
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: err.response?.data || err.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
  🚀 Legalbook Email API Server started
  📡 Port: ${PORT}
  🕐 Time: ${new Date().toISOString()}
  🔑 API Key loaded: ${process.env.BREVO_API_KEY ? "Yes ✓" : "No ✗"}
  `);
});