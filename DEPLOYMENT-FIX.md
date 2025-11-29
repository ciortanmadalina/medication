# Deployment Fix for Netlify

## Problem
Netlify Functions run in a **read-only filesystem**, so they cannot write to `data/db.json`. This causes the 500 error you're seeing.

## Solution
I've updated the app to use **Netlify Blobs** - a free key-value storage service included with Netlify.

## Steps to Fix

### 1. Install New Dependency Locally

```bash
npm install
```

This will install `@netlify/blobs` that was added to package.json.

### 2. Commit and Push Changes

```bash
git add .
git commit -m "Fix: Use Netlify Blobs for data storage"
git push
```

### 3. Enable Netlify Blobs (if needed)

Netlify Blobs should be automatically available, but if you get errors:

1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to "Site configuration" → "Environment variables"
4. Blobs should be automatically enabled

### 4. Redeploy

Netlify will automatically redeploy when you push. Or manually trigger:
- Go to "Deploys" → "Trigger deploy" → "Deploy site"

### 5. Test

After deployment:
1. Visit your site: `https://classy-cucurucho-41b0a8.netlify.app`
2. The doses should now load correctly
3. Enable notifications
4. Subscribe to push

## What Changed

- Created `netlify/functions/db-helper.js` - Handles database operations
- Uses **Netlify Blobs** in production (automatic persistent storage)
- Uses **local file system** in development (npm run dev)
- All functions updated to use the helper

## Testing Locally

Local development still works the same:

```bash
npm run dev
```

The app will use `data/db.json` locally, and Netlify Blobs in production.

## Verify It Works

After redeployment, check:

```bash
curl https://classy-cucurucho-41b0a8.netlify.app/.netlify/functions/getStatus
```

Should return:
```json
{
  "doses": [
    { "id": "D1", "label": "Morning - Vitamin D", ... },
    ...
  ],
  "subscriptionCount": 0
}
```

---

## Alternative: Use External Database (Optional)

If Netlify Blobs doesn't work for some reason, you could use:
- **Supabase** (free PostgreSQL)
- **MongoDB Atlas** (free tier)
- **Firebase Realtime Database** (free tier)

But Netlify Blobs should work perfectly for this use case!
