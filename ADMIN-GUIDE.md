# ⚙️ Admin Panel Guide

The Admin Panel provides a user-friendly interface to manage your medication reminders without editing JSON files.

## Access the Admin Panel

1. Open your app: `http://localhost:8888` (or your Netlify URL)
2. Scroll to the bottom and click **"⚙️ Admin Panel"**
3. Or directly navigate to `/admin.html`

## Features

### 📋 View All Medications
- See all configured medications with their times and IDs
- Clear overview of your medication schedule

### ➕ Add New Medication

1. Click **"+ Add New"** button
2. Enter:
   - **Medication Name**: e.g., "Morning - Vitamin D"
   - **Time**: Select the time (24-hour format)
3. Click **"Save"**
4. The medication will be added immediately
5. Scheduler will start checking this medication on the next run

### ✏️ Edit Medication

1. Click **"Edit"** button next to any medication
2. Modify the name or time
3. Click **"Save"**
4. Changes take effect immediately
5. If time is changed, today's reminder will be updated

### 🗑️ Delete Medication

1. Click **"Delete"** button next to any medication
2. Confirm the deletion in the popup
3. The medication is removed from:
   - Configuration
   - Today's doses
   - Any active snoozes

## Backend Functions

The admin panel uses these Netlify Functions:

| Function | Method | Purpose |
|----------|--------|---------|
| `getMedications` | GET | List all medications |
| `addMedication` | POST | Add new medication |
| `updateMedication` | POST | Update existing medication |
| `deleteMedication` | POST | Delete medication |

## Data Format

Each medication has:
- `id`: Unique identifier (e.g., "D1", "D2", or timestamp-based)
- `label`: Display name (e.g., "Morning - Vitamin D")
- `time`: 24-hour format (e.g., "08:00")

## API Examples

### Get all medications
```bash
curl http://localhost:8888/.netlify/functions/getMedications
```

### Add medication
```bash
curl -X POST http://localhost:8888/.netlify/functions/addMedication \
  -H "Content-Type: application/json" \
  -d '{"id":"D8","label":"Evening - Calcium","time":"20:00"}'
```

### Update medication
```bash
curl -X POST http://localhost:8888/.netlify/functions/updateMedication \
  -H "Content-Type: application/json" \
  -d '{"id":"D1","label":"Morning - Vitamin D (Updated)","time":"08:30"}'
```

### Delete medication
```bash
curl -X POST http://localhost:8888/.netlify/functions/deleteMedication \
  -H "Content-Type: application/json" \
  -d '{"id":"D1"}'
```

## Tips

1. **Unique IDs**: The system auto-generates unique IDs when adding new medications
2. **Time Format**: Use 24-hour format (08:00, 13:00, 21:00)
3. **Immediate Effect**: Changes are saved immediately to the database
4. **Scheduler Integration**: The scheduler automatically picks up new/changed medications
5. **Mobile Friendly**: The admin panel works on mobile devices too

## Troubleshooting

### Can't save changes?
- Check browser console for errors
- Verify Netlify Functions are running
- Ensure database permissions (local testing)

### Changes don't appear?
- Refresh the page
- Check if the function returned an error
- Verify network connection

### Lost medications?
- Check `data/db.json` locally
- In production, check Netlify Blobs storage
- Medications are never automatically deleted

## Security Note

⚠️ **Important**: This admin panel has no authentication. Anyone with the URL can modify medications.

For production use, consider adding:
- Password protection
- Environment-based access control
- Netlify Identity integration
- Basic auth via Netlify

---

Enjoy managing your medications with ease! 💊
