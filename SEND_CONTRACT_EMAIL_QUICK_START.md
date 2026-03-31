# 🚀 Send Contract by Email - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Configure Website Email (1 minute)
1. Open your app and go to **"Gestion du Site Web"** (Website Management)
2. Click **Contacts** tab
3. Fill in the **Email** field: `your-company@example.com`
4. Click **"Enregistrer les contacts"** (Save)

### 2. Choose Email Service (2 minutes)

#### **Easiest: Resend.com** (Recommended)
- Go to https://resend.com/
- Create free account
- Copy your API key
- Add to Supabase as secret: `RESEND_API_KEY`

#### **Alternative: SendGrid**
- Go to https://sendgrid.com/
- Get API key
- Add to Supabase as secret: `SENDGRID_API_KEY`

### 3. Deploy Function (2 minutes)
```bash
# Using Supabase CLI
supabase functions deploy send-contract-email --no-verify-jwt

# Or through dashboard:
# Supabase → Edge Functions → New Function → send-contract-email
```

### 4. Test It!
1. Create a reservation with a client
2. Click **⋮** (three dots) on the reservation card
3. Select **"📧 Envoyer par Email"**
4. Verify email address and click **"Envoyer"**
5. Check your email!

---

## 🎯 What It Does

✅ **Generates professional contracts** in French or Arabic
✅ **Pre-fills client email** from database
✅ **Shows sender email** from website settings
✅ **Sends via secure email service**
✅ **Saves email address** to client record (optional)
✅ **Shows success/error notifications**

---

## 📊 Feature Checklist

### Frontend ✅
- [x] SendContractModal component created
- [x] Menu item added to reservation cards
- [x] Language selector (FR/AR)
- [x] Email input validation
- [x] Loading states
- [x] Error handling
- [x] Success notifications

### Backend ✅
- [x] emailService.ts created
- [x] Contract HTML generation
- [x] Base64 conversion
- [x] Edge Function skeleton created
- [x] CORS configured

### Database ✅
- [x] Website contacts email field (already exists)
- [x] Client email field (already exists)
- [x] All data accessible via existing queries

---

## 🔧 How to Use

### From Reservation Card:
```
1. Find reservation
2. Click ⋮ (three dots menu)
3. Select 📧 "Envoyer par Email"
4. Modal opens
5. Review email address
6. Select language (FR/AR)
7. Click "Envoyer"
8. Wait for confirmation
9. Check inbox!
```

### Email Content:
- Professional HTML contract
- Agency logo and name
- All reservation details
- Client signature spaces
- Bilingual support (FR/AR)
- A4-ready format

---

## 📧 Email Service Comparison

| Feature | Resend | SendGrid | AWS SES |
|---------|--------|----------|---------|
| **Free Tier** | 100/day | 100/day | $0.10 ea |
| **Ease** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Setup Time** | 2 min | 5 min | 10 min |
| **Recommended** | ✅ YES | ✅ YES | Not for small |

---

## 🐛 Troubleshooting

### Email not received?
1. Check spam folder
2. Verify sender email in website settings
3. Check email service provider dashboard
4. Verify API key is correct

### Modal won't open?
1. Hard refresh page (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify you're logged in
4. Check reservation is valid

### "Email of contact not configured"?
1. Go to Website Management
2. Click Contacts tab
3. Fill in Email field
4. Click Save

---

## 💡 Tips

- **Email Pre-filled**: Client email is auto-filled from database
- **Language Matters**: Choose FR/AR based on client preference
- **Save for Later**: Check box to save edited email to client record
- **Bulk Send**: Currently sends one at a time (future enhancement)
- **Test First**: Send to yourself to verify format

---

## 🔗 Integration Points

### Used Services:
- ✅ Supabase (database + edge functions)
- ✅ Website contacts (sender email)
- ✅ Client records (recipient email)
- ✅ Reservation details (contract content)

### Email Providers:
- Resend / SendGrid / AWS SES / Custom SMTP

### Languages Supported:
- 🇫🇷 French (LTR)
- 🇸🇦 Arabic (RTL)

---

## 📦 Files & Structure

```
src/
├── components/
│   ├── PlannerPage.tsx (updated - added menu item & modal)
│   └── SendContractModal.tsx (NEW)
└── services/
    └── emailService.ts (NEW)

supabase/functions/
└── send-contract-email/
    ├── index.ts (basic skeleton)
    └── index-with-resend.ts (with Resend integration)
```

---

## ✅ Verification

To verify everything is working:

1. ✅ **Menu Item**: Visible in three-dots menu
2. ✅ **Modal Opens**: Clicking item opens modal
3. ✅ **Email Pre-filled**: Client email loads
4. ✅ **Sender Loads**: Website email displays
5. ✅ **Language Toggle**: FR/AR buttons work
6. ✅ **Loading State**: Shows while sending
7. ✅ **Success Message**: Confirms sent
8. ✅ **Email Received**: Check inbox

---

## 📞 Next Steps

1. **Set up email service** (choose Resend/SendGrid)
2. **Configure website email** (settings page)
3. **Deploy Edge Function** (Supabase CLI)
4. **Test with sample reservation**
5. **Train team** on feature

---

## 🎉 You're Done!

Your team can now send contracts via email directly from the app!

**Questions?** See the full implementation guide: `SEND_CONTRACT_EMAIL_IMPLEMENTATION.md`
