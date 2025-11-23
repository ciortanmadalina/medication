# 🧪 Testing Guide for Medication Reminder PWA

## Prerequisites

- Node.js installed
- Chrome or Edge browser (for best PWA support)
- Dependencies installed (`npm install` already done)

## Step-by-Step Local Testing

### 1. Setup VAPID Keys (One-time)

Run the automated setup:

```bash
node setup.js
```

This will:
- Generate VAPID keys
- Update `.env` file
- Update `public/index.html` with the public key
- Prompt for your email

**OR** manually:

```bash
npx web-push generate-vapid-keys
```

Then copy the keys to:
- `.env` file (both keys + email)
- `public/index.html` line 269 (public key only)

### 2. Start Local Server

```bash
npm run dev
```

Server starts at `http://localhost:8888`

### 3. Test the Web Interface

1. Open `http://localhost:8888` in Chrome
2. You should see:
   - Header: "💊 Medication Reminder"
   - "Enable Notifications" button
   - List of 7 medications with status (pending/overdue/taken)

### 4. Test Basic Functionality

#### A. View Medications
- All 7 doses should be listed with their times
- Status should show as "pending" or "overdue" based on current time

#### B. Check Dose Status API
```bash
curl http://localhost:8888/.netlify/functions/getStatus
```

Expected output:
```json
{
  "doses": [
    {
      "id": "D1",
      "label": "Morning - Vitamin D",
      "time": "08:00",
      "status": "pending",
      "dueAtISO": "2025-11-23T08:00:00.000Z",
      "takenAtISO": null
    },
    ...
  ],
  "subscriptionCount": 0
}
```

### 5. Test Netlify Functions Manually

#### Initialize Today's Doses
```bash
curl http://localhost:8888/.netlify/functions/scheduler
```

This initializes doses for today and sends any overdue reminders.

#### Mark a Dose as Taken
```bash
curl -X POST http://localhost:8888/.netlify/functions/markDoseAsTaken \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D1\"}"
```

Expected: `{"success":true,"message":"Dose marked as taken","dose":{...}}`

#### Snooze a Dose
```bash
curl -X POST http://localhost:8888/.netlify/functions/snoozeDose \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D2\",\"minutes\":10}"
```

Expected: `{"success":true,"message":"Dose snoozed for 10 minutes",...}`

#### Refresh the page
After marking taken/snoozing, refresh `http://localhost:8888` and verify the status updated.

### 6. Test Push Notifications (Requires HTTPS)

**Problem:** Push notifications require HTTPS, but localhost is HTTP.

**Solution:** Use ngrok to create an HTTPS tunnel.

#### A. Install ngrok
```bash
npm install -g ngrok
```

#### B. Start ngrok tunnel
In a **new terminal**:
```bash
ngrok http 8888
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8888
```

#### C. Test with HTTPS
1. Open the `https://abc123.ngrok.io` URL in Chrome (on desktop or Android)
2. Click "Enable Notifications"
3. Grant permission when prompted
4. Notification subscription is saved

#### D. Check Subscription
```bash
curl http://localhost:8888/.netlify/functions/getStatus
```

`subscriptionCount` should now be `1`.

#### E. Send a Test Notification
```bash
curl -X POST http://localhost:8888/.netlify/functions/sendReminder \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D1\"}"
```

You should receive a notification with:
- Title: "💊 Medication Reminder"
- Body: "Time to take: Morning - Vitamin D"
- Actions: "I Took It" and "Snooze 10m"

#### F. Test Action Buttons
1. When notification appears, click **"I Took It"**
   - Dose should be marked as taken
   - Refresh the page to see status change

2. Send another notification for D2, click **"Snooze 10m"**
   - Dose is snoozed for 10 minutes
   - Scheduler won't send reminders during snooze period

### 7. Test Scheduler Logic

The scheduler checks every 5 minutes in production. For local testing:

#### A. Simulate Overdue Dose

1. Edit `data/db.json` and change a dose time to 10 minutes ago:
```json
{
  "doses": {
    "config": [
      { "id": "D1", "label": "Test Dose", "time": "10:30" }
    ]
  }
}
```

If current time is 10:40, this dose is overdue.

2. Run scheduler:
```bash
curl http://localhost:8888/.netlify/functions/scheduler
```

3. If subscribed to push, you should get a notification immediately.

#### B. Test Repeat Reminders

1. Don't mark the dose as taken
2. Wait 5+ minutes
3. Run scheduler again:
```bash
curl http://localhost:8888/.netlify/functions/scheduler
```

4. Another notification should be sent

#### C. Verify Snooze Works

1. Snooze a dose:
```bash
curl -X POST http://localhost:8888/.netlify/functions/snoozeDose \
  -H "Content-Type: application/json" \
  -d "{\"doseId\":\"D1\",\"minutes\":1}"
```

2. Immediately run scheduler:
```bash
curl http://localhost:8888/.netlify/functions/scheduler
```

3. No notification should be sent (dose is snoozed)

4. Wait 1+ minute, run scheduler again - notification should now send

### 8. Test on Android

#### A. Via ngrok (Best for full testing)
1. Ensure ngrok is running
2. On your Android phone, open Chrome
3. Navigate to the ngrok HTTPS URL
4. Add to home screen (PWA install)
5. Enable notifications
6. Test as above

#### B. Local Network (Limited)
1. Find your PC's local IP (e.g., `ipconfig` shows `192.168.1.100`)
2. Ensure firewall allows port 8888
3. On Android, open `http://192.168.1.100:8888`
4. Note: Push won't work without HTTPS

### 9. Verify Data Persistence

All data is stored in `data/db.json`. Check the file:

```bash
type data\db.json   # Windows CMD
cat data/db.json    # Git Bash/WSL
```

You should see:
- `subscriptions`: Array of push subscriptions
- `doses.config`: Your 7 medication configurations
- `doses.today`: Current day's dose tracking
- `snoozes`: Active snoozes

### 10. Test Edge Cases

#### A. Midnight Rollover
1. Manually change system time to 23:58
2. Run scheduler
3. Wait for midnight (or change time to 00:02)
4. Run scheduler again
5. Verify new doses are initialized in `data/db.json`

#### B. Multiple Subscriptions
1. Open app in Chrome
2. Subscribe to notifications
3. Open app in Edge (or incognito)
4. Subscribe again
5. Send a reminder - both browsers should get notification

#### C. Failed Subscription
1. Subscribe to push
2. Manually corrupt the subscription in `data/db.json`
3. Send reminder
4. Check that failed subscription is removed automatically

## Common Issues

### "Service Worker registration failed"
- Check console for errors
- Ensure service-worker.js path is correct
- Clear browser cache and reload

### "Push subscription failed"
- Verify VAPID keys are correct
- Check that HTTPS is used (via ngrok)
- Ensure notification permission is granted

### "Dose not marked as taken"
- Check browser console and network tab
- Verify function endpoint is correct
- Check `data/db.json` file permissions

### Scheduler doesn't send notifications
- Ensure subscription exists (check getStatus)
- Verify dose is overdue and not taken
- Check dose is not snoozed
- Run scheduler manually for testing

## Production Testing (After Netlify Deploy)

Once deployed to Netlify:

1. Scheduled functions run automatically every 5 minutes
2. HTTPS is enabled by default
3. Test on real Android device
4. Monitor Netlify Functions logs for errors
5. Verify notifications arrive on schedule

## Debug Tools

### Check Logs
In Netlify Dev, logs appear in the terminal.

### Check Database State
```bash
type data\db.json | findstr /V "endpoint"  # Hide subscription details
```

### Reset Database
```bash
copy data\db.json data\db.json.backup
# Edit db.json to reset doses.today to []
```

### Test Notification Payload
```javascript
// In browser console
fetch('/.netlify/functions/sendReminder', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({doseId: 'D1'})
}).then(r => r.json()).then(console.log)
```

---

## Quick Test Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] VAPID keys generated and configured
- [ ] Server starts (`npm run dev`)
- [ ] Web page loads with 7 doses
- [ ] Can subscribe to notifications (via ngrok HTTPS)
- [ ] Can mark dose as taken
- [ ] Can snooze dose
- [ ] Scheduler initializes doses
- [ ] Scheduler sends overdue reminders
- [ ] Notification action buttons work
- [ ] Status updates refresh on page

---

Congrats! Your medication reminder PWA is fully functional! 🎉
