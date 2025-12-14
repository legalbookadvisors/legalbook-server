// Vercel Serverless Function
import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, totalScore, category, sectionScores, company } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, phone' 
      });
    }

    // Your Brevo API integration
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Legalbook',
          email: 'no-reply@radhikakabbade.com'
        },
        to: [{ email: 'sales@legalbook.io', name: 'Legalbook Sales Team' }],
        subject: 'New Audit Submission - Legalbook Assessment',
        htmlContent: `
          <h2>New Audit Submission</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Phone:</b> ${phone}</p>
          ${company ? `<p><b>Company:</b> ${company}</p>` : ''}
          <p><b>Total Score:</b> ${totalScore}</p>
          <p><b>Category:</b> ${category}</p>
          <pre>${JSON.stringify(sectionScores, null, 2)}</pre>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({ 
      success: true, 
      messageId: response.data.messageId 
    });

  } catch (error) {
    console.error('Email error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to send email';
    if (error.response?.status === 401) {
      errorMessage = 'Invalid API key';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid email data';
    }

    return res.status(error.response?.status || 500).json({
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
}