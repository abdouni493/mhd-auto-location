# 📧 SEND CONTRACT EMAIL - SETUP GUIDE

**Status:** ✅ Feature is working (Mock Mode)

---

## 🎉 Current Status

The Send Contract by Email feature is **fully functional** in your application:

✅ Button appears on reservation cards  
✅ Modal opens and displays form  
✅ Contract HTML is generated (bilingual FR/AR)  
✅ Request is sent to backend successfully  
✅ Success message displays to user  

**However:** Emails are currently **simulated** (not actually sent)

---

## 🚀 To Actually Send Emails

You have 3 options:

### Option 1: Resend.com (RECOMMENDED - Easiest & Free Tier)

**Step 1: Sign up**
- Go to https://resend.com
- Sign up with your email
- Verify email
- **Free tier:** 100 emails/day (perfect for testing)

**Step 2: Get API Key**
- Go to Dashboard → API Keys
- Create new API Key
- Copy the key (starts with `re_`)

**Step 3: Add to Environment**

Create `.env.local` in your project root:
```env
VITE_RESEND_API_KEY=re_your_key_here
```

**Step 4: Update Proxy Server**

Restart the proxy with environment variable:
```bash
$env:VITE_RESEND_API_KEY = "re_your_key_here"
node send-contract-proxy.cjs
```

Or on Linux/Mac:
```bash
VITE_RESEND_API_KEY="re_your_key_here" node send-contract-proxy.cjs
```

**Step 5: Uncomment Resend Integration**

In `send-contract-proxy.cjs`, uncomment lines 57-85 to enable real email sending.

---

### Option 2: SendGrid (Enterprise - Free Tier Available)

**Step 1:** Sign up at https://sendgrid.com  
**Step 2:** Get API Key from settings  
**Step 3:** Update proxy server with integration code  
**Step 4:** Set environment variable and restart

---

### Option 3: Deploy to Supabase (Production)

When you have deployment permissions:

```bash
supabase functions deploy send-contract-email
```

The Edge Function already has Resend integration ready (see `index-with-resend.ts`)

---

## 📋 Integration Checklist

For **Resend.com** (Recommended):

- [ ] Create Resend.com account
- [ ] Get API key
- [ ] Add to environment variable
- [ ] Update `send-contract-proxy.cjs` with Resend code
- [ ] Restart proxy server
- [ ] Configure sender email in Resend domain settings
- [ ] Test email sending
- [ ] Monitor email logs in Resend dashboard

---

## 🧪 Testing

**Before integrating real email service:**

1. Ensure proxy is running: `node send-contract-proxy.cjs`
2. Click "📧 Envoyer par Email" on any reservation
3. Fill in email address
4. Click "Envoyer"
5. See success message ✅

**After integrating email service:**

1. Check your email inbox (may take 30 seconds)
2. Verify contract is attached/displayed correctly
3. Check Resend/SendGrid dashboard for delivery status

---

## 💾 Current Mock Setup

Your system currently:
- ✅ Accepts email requests
- ✅ Validates data
- ✅ Generates bilingual contracts (FR/AR)
- ✅ Returns success response
- ✅ Shows success to user
- ❌ Does NOT actually send email (simulated)

The mock mode is **useful for testing UI/UX** before enabling real email sending.

---

## 🔧 Resend Integration Code (Ready to Use)

In `send-contract-proxy.cjs`, the commented code (lines 57-85) is ready:

```javascript
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY not configured');
}

const htmlContent = Buffer.from(payload.htmlBase64, 'base64').toString('utf-8');

const emailResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: payload.sender,
    to: payload.email,
    subject: payload.language === 'fr' 
      ? 'Votre Contrat de Location'
      : 'عقد التأجير الخاص بك',
    html: htmlContent,
  }),
});
```

Just uncomment and restart!

---

## 🎯 Production Deployment

For production, the proper flow is:

```
Frontend
  ↓
Supabase Edge Function (send-contract-email)
  ↓
Resend API
  ↓
Customer Email
```

With Supabase deployment, no proxy server is needed!

---

## 📊 Email Service Comparison

| Service | Cost | Speed | Setup | Support |
|---------|------|-------|-------|---------|
| **Resend** | Free up to 100/day | ⚡ Fast | ✅ Easy | 24/7 |
| **SendGrid** | Free tier limited | ⚡ Fast | Medium | Good |
| **AWS SES** | Pay-per-use | Fast | Hard | Limited |
| **Mailgun** | Free tier | Fast | Medium | Good |

**Recommendation:** Start with Resend for simplicity and free tier.

---

## 🚀 Next Steps

1. Sign up for Resend.com (2 minutes)
2. Get API key
3. Set environment variable
4. Uncomment Resend code in proxy
5. Test email sending
6. Deploy to production when ready

---

**Feature Status: 90% Complete** ✅  
(Just needs email provider configuration)
