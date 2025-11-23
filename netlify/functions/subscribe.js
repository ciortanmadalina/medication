const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const subscription = JSON.parse(event.body);
    
    // Read current database
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

    // Upsert subscription by endpoint
    const existingIndex = db.subscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );

    if (existingIndex >= 0) {
      db.subscriptions[existingIndex] = subscription;
    } else {
      db.subscriptions.push(subscription);
    }

    // Save database
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Subscription saved' })
    };
  } catch (error) {
    console.error('Subscribe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
