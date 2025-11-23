const webpush = require('web-push');
const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:example@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { doseId } = JSON.parse(event.body);
    
    // Read database
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

    // Find dose details
    const doseConfig = db.doses.config.find(d => d.id === doseId);
    const doseToday = db.doses.today.find(d => d.id === doseId);

    if (!doseConfig || !doseToday) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Dose not found' })
      };
    }

    const payload = JSON.stringify({
      title: '💊 Medication Reminder',
      body: `Time to take: ${doseConfig.label}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `dose:${doseId}`,
      data: {
        doseId: doseId,
        doseLabel: doseConfig.label
      },
      actions: [
        { action: 'take', title: 'I Took It' },
        { action: 'snooze', title: 'Snooze 10m' }
      ],
      requireInteraction: true
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      db.subscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload)
      )
    );

    // Remove failed subscriptions
    const failedEndpoints = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ index }) => db.subscriptions[index].endpoint);

    if (failedEndpoints.length > 0) {
      db.subscriptions = db.subscriptions.filter(
        sub => !failedEndpoints.includes(sub.endpoint)
      );
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      })
    };
  } catch (error) {
    console.error('Send reminder error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
