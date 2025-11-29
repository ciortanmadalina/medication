# 💊 Medication Reminder PWA

A free Progressive Web App hosted on Netlify that sends Android push notifications to remind you to take 7 daily medications.

## Features

- ✅ **Push Notifications** with action buttons: "I Took It" and "Snooze 10m"
- ⏰ **Smart Reminders** - Keeps sending until dose is marked taken
- 📱 **PWA** - Install on Android home screen
- 🆓 **100% Free** - No paid services required
- 🔔 **Persistent Reminders** - Automatic checks every 15 minutes (in production)
- ⚙️ **Admin Panel** - Add, edit, and delete medications via web interface

## Tech Stack

- **Hosting:** Netlify (Functions + Static Site)
- **Frontend:** Vanilla JavaScript PWA
- **Push:** Web Push API with VAPID
- **Data:** Netlify Blobs (production) + JSON file (development)
- **Notifications:** Android-compatible push notifications

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copy the output and update `.env`:

```env
VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:your-email@example.com
```

Also update the `VAPID_PUBLIC_KEY` in `public/index.html` (line 269):

```javascript
const VAPID_PUBLIC_KEY = '<your_public_key>';
```

### 3. Test Locally

```bash
npm run dev
```

This starts Netlify Dev at `http://localhost:8888`

## Testing Locally

### A. Test the Web Interface

1. Open `http://localhost:8888` in your browser
2. Click "Enable Notifications" and allow permissions
3. You should see the list of 7 medications with their status

### B. Test Push Notifications (Desktop)

Since local testing of push notifications requires HTTPS, you have two options:

**Option 1: Use ngrok (Recommended for full testing)**

```bash
# Install ngrok
npm install -g ngrok

# In terminal 1, start Netlify Dev
npm run dev

# In terminal 2, expose it
ngrok http 8888
```

Then open the `https://` URL from ngrok in Chrome on your phone or desktop.

**Option 2: Test functions manually**

```bash
# Initialize today's doses
curl -X GET http://localhost:8888/.netlify/functions/scheduler

# Manually trigger a reminder for dose D1
curl -X POST http://localhost:8888/.netlify/functions/sendReminder \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D1\"}"

# Mark a dose as taken
curl -X POST http://localhost:8888/.netlify/functions/markDoseAsTaken \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D1\"}"

# Snooze a dose
curl -X POST http://localhost:8888/.netlify/functions/snoozeDose \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D2\",\"minutes\":10}"

# Get status
curl http://localhost:8888/.netlify/functions/getStatus
```

### C. Test Scheduler Logic

The scheduler runs automatically every 5 minutes in production. For local testing:

```bash
# Run scheduler manually
curl http://localhost:8888/.netlify/functions/scheduler
```

This will:
- Initialize today's doses if not already done
- Check each dose
- Send reminders for overdue, untaken, non-snoozed doses

### D. Simulate Time-Based Testing

1. Modify dose times in `data/db.json` to be in the past:

```json
{
  "doses": {
    "config": [
      { "id": "D1", "label": "Test Dose", "time": "10:00" }
    ]
  }
}
```

2. If current time is after 10:00, the scheduler will send a reminder
3. Run: `curl http://localhost:8888/.netlify/functions/scheduler`

## Deploy to Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy on Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repo
4. Configure:
   - Build command: `echo "No build needed"`
   - Publish directory: `public`
5. Add environment variables in Netlify dashboard:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

### 3. Enable Scheduled Functions

After deployment, scheduled functions run automatically every 5 minutes.

Note: The scheduled function configuration is in `netlify.toml` (currently commented out). Netlify automatically detects the scheduler function.

## Configuration

### Customize Medications

**Option 1: Use Admin Panel (Recommended)**

1. Open your app in the browser
2. Click "⚙️ Admin Panel" link at the bottom
3. Add, edit, or delete medications with a user-friendly interface

**Option 2: Edit `data/db.json` manually**

```json
{
  "doses": {
    "config": [
      { "id": "D1", "label": "Your Medicine Name", "time": "08:00" },
      { "id": "D2", "label": "Another Medicine", "time": "14:00" }
    ]
  }
}
```

### Customize Reminder Frequency

Edit `netlify.toml` to change the cron schedule (currently set to every 15 minutes):

```toml
[[scheduled.functions]]
  name = "scheduler"
  cron = "*/15 * * * *"  # Every 15 minutes
```

## Project Structure

```
medication/
├── public/
│   ├── index.html              # Main app UI
│   ├── admin.html              # Admin panel for managing medications
│   ├── service-worker.js       # Push notification handler
│   ├── manifest.webmanifest    # PWA manifest
│   └── icons/                  # App icons
├── netlify/
│   └── functions/
│       ├── db-helper.js        # Database abstraction (Blobs + file)
│       ├── subscribe.js        # Save push subscription
│       ├── sendReminder.js     # Send push notification
│       ├── markDoseAsTaken.js  # Mark dose as taken
│       ├── snoozeDose.js       # Snooze a dose
│       ├── scheduler.js        # Cron job (every 15 min)
│       ├── getStatus.js        # Get dose status
│       ├── getMedications.js   # List all medications
│       ├── addMedication.js    # Add new medication
│       ├── updateMedication.js # Update medication
│       └── deleteMedication.js # Delete medication
├── data/
│   └── db.json                 # Simple JSON database
├── netlify.toml                # Netlify config
├── package.json
└── .env                        # VAPID keys (local only)
```

## How It Works

1. **User subscribes** → Push subscription saved in `db.json`
2. **Scheduler runs** (every 5 min) → Checks all doses
3. **If overdue & not taken** → Sends push notification via Web Push API
4. **User gets notification** → Two action buttons appear
5. **"I Took It"** → Marks dose taken, stops reminders
6. **"Snooze 10m"** → Delays next reminder by 10 minutes
7. **Daily reset** → Scheduler initializes new day's doses at midnight

## Troubleshooting

### Notifications not working?

1. Check browser console for errors
2. Verify VAPID keys are correct in `.env` and `index.html`
3. Ensure notification permissions are granted
4. Test with HTTPS (use ngrok for local testing)

### Scheduler not running locally?

- Scheduled functions only work in production on Netlify
- For local testing, manually call the scheduler function

### Database not updating?

- Check file permissions on `data/db.json`
- Ensure the file is writable

## License

MIT

## Credits

Built with ❤️ using Netlify, Web Push API, and vanilla JavaScript.
