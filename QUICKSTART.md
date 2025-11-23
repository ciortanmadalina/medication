# 🚀 Quick Start - 3 Steps to Test Locally

## Step 1: Setup (First Time Only)

Run the automated setup to generate VAPID keys:

```bash
node setup.js
```

Enter your email when prompted (e.g., `mailto:you@example.com`)

This automatically configures:
- `.env` file with VAPID keys
- `public/index.html` with public VAPID key

## Step 2: Start Development Server

```bash
npm run dev
```

Server will start at: **http://localhost:8888**

## Step 3: Test in Browser

1. Open **Chrome** or **Edge** browser
2. Navigate to **http://localhost:8888**
3. You should see:
   - 💊 Medication Reminder header
   - "Enable Notifications" button
   - List of 7 daily medications

---

## Testing Push Notifications (Optional)

Push notifications require HTTPS. For full testing:

### Use ngrok (Recommended)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
ngrok http 8888
```

Then open the **https://** URL from ngrok in your browser or Android phone.

---

## Manual Function Testing

Test API endpoints directly:

### Initialize Today's Doses
```bash
curl http://localhost:8888/.netlify/functions/scheduler
```

### Get Dose Status
```bash
curl http://localhost:8888/.netlify/functions/getStatus
```

### Mark Dose as Taken
```bash
curl -X POST http://localhost:8888/.netlify/functions/markDoseAsTaken -H "Content-Type: application/json" -d "{\"doseId\":\"D1\"}"
```

### Snooze a Dose
```bash
curl -X POST http://localhost:8888/.netlify/functions/snoozeDose -H "Content-Type: application/json" -d "{\"doseId\":\"D2\",\"minutes\":10}"
```

---

## Troubleshooting

**Port already in use?**
```bash
# Change port in netlify.toml or kill the process using port 8888
```

**Can't generate VAPID keys?**
```bash
npx web-push generate-vapid-keys
# Manually copy keys to .env and public/index.html
```

**Need more help?**
- Read `TESTING.md` for comprehensive testing guide
- Read `README.md` for full documentation

---

## Next Steps

✅ Local testing complete? Deploy to Netlify!

See **README.md** section "Deploy to Netlify" for deployment instructions.

---

Happy coding! 💊
