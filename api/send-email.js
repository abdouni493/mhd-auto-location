/**
 * Vercel Serverless Function for Email Sending
 * Integrates with Brevo SMTP Send API
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    // Validate required fields
    if (!payload.email || !payload.sender || !payload.htmlBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, sender, or htmlBase64',
      });
    }

    console.log(`📧 Processing email for: ${payload.email}`);
    console.log(`👤 Language: ${payload.language}`);

    // Get Brevo API key from environment
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable not configured');
    }

    // Decode base64 HTML content
    const htmlContent = Buffer.from(payload.htmlBase64, 'base64').toString('utf-8');

    console.log('📤 Sending email via Brevo API...');

    // Send email using Brevo SMTP Send API
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'AUTO LOCATION',
          email: payload.sender || 'noreply@autolocation.com',
        },
        to: [
          {
            email: payload.email,
          },
        ],
        subject:
          payload.language === 'fr'
            ? 'Votre Contrat de Location - AUTO LOCATION'
            : 'عقد التأجير الخاص بك - AUTO LOCATION',
        htmlContent: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ Brevo API error:', emailResponse.status, errorText);
      throw new Error(`Brevo API error: ${emailResponse.status} - ${errorText}`);
    }

    const emailData = await emailResponse.json();

    console.log('✅ Email sent successfully via Brevo!');
    console.log('📧 Message ID:', emailData.messageId);

    const response = {
      success: true,
      message: 'Contract email sent successfully',
      details: {
        to: payload.email,
        from: payload.sender || 'noreply@autolocation.com',
        subject:
          payload.language === 'fr'
            ? 'Votre Contrat de Location - AUTO LOCATION'
            : 'عقد التأجير الخاص بك - AUTO LOCATION',
        language: payload.language,
        messageId: emailData.messageId,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
