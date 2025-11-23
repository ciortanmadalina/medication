# Reminder app
## Goal
Build a **free Progressive Web App (PWA)** hosted on **Netlify** that reminds the user to take 7 medicines daily.  
It must:
- Send **Android push notifications** with **two action buttons**: “I Took It” and “Snooze 10m”.
- Keep sending notifications until the dose is marked taken.
- Store dose status in a simple JSON file.
- Use **no paid services** and **no Android native code**.

---

## Tech Stack
- **Hosting:** Netlify (Functions + Scheduled Functions)
- **Frontend:** Vanilla JS PWA (index.html + manifest + service-worker)
- **Push:** Web Push API with **VAPID keys**
- **Data:** `/data/db.json` file
- **Schedule:** Netlify scheduled function (runs every 5 minutes)

---

## Tasks for Copilot / Claude

1) Scaffold folders:

    /public (index.html, manifest.webmanifest, service-worker.js)
    /netlify/functions (subscribe.js, sendReminder.js, markDoseAsTaken.js, snoozeDose.js, scheduler.js)
    /data/db.json
    netlify.toml
    .env

2) Generate **VAPID keys** and put them in `.env`:

    npx web-push generate-vapid-keys

    .env:
    VAPID_PUBLIC_KEY=...
    VAPID_PRIVATE_KEY=...

3) Implement Netlify Functions:
- **subscribe.js** → saves push subscription in `data/db.json` (upsert by `endpoint`)
- **sendReminder.js** → uses `web-push` + VAPID to send a notification with actions “I Took It” / “Snooze 10m”
- **markDoseAsTaken.js** → marks today’s `doseId` as taken
- **snoozeDose.js** → snoozes `doseId` for 10 minutes
- **scheduler.js** → runs every 5 min; for each of 7 configured daily doses: if due/overdue, not taken, not snoozed, call `sendReminder`. Update `lastSentISO`.

4) Service Worker (`public/service-worker.js`) must:
- Handle `push` → `showNotification({ actions: [{action:'take', title:'I Took It'},{action:'snooze', title:'Snooze 10m'}], tag:'dose:<ID>', data:{doseId}})`
- Handle `notificationclick`:
  - if action `take` → `fetch('/.netlify/functions/markDoseAsTaken', {method:'POST', body: JSON.stringify({doseId})})`
  - if action `snooze` → `fetch('/.netlify/functions/snoozeDose', {method:'POST', body: JSON.stringify({doseId, minutes:10})})`
  - always `event.notification.close()`

5) Frontend (`public/index.html`):
- Button to register service worker, subscribe to push using **VAPID_PUBLIC_KEY** (convert to `Uint8Array`).
- Simple “Today” view listing 7 doses with status (`pending/overdue/taken`) from `/.netlify/functions/*`.

6) `netlify.toml` (enable scheduled function):

    [[scheduled.functions]]
    name = "scheduler"
    cron = "*/5 * * * *"

---

## Data Model (MVP JSON at `data/db.json`)
- `subscriptions`: array of Push API subscriptions
- `doses.config`: 7 items `{ id: "D1"…"D7", label, time: "HH:MM" }`
- `doses.today`: generated daily; items `{ id, dueAtISO, takenAtISO|null, lastSentISO|null }`
- `snoozes`: items `{ doseId, untilISO }`

---

## Definition of Done
- PWA installable; user can subscribe to push.
- Android receives notifications at/after due time with actions.
- “I Took It” marks dose as taken and stops further nags for that dose.
- “Snooze 10m” defers the next reminder.
- Scheduler runs every 5 minutes on Netlify and re-sends until taken.
