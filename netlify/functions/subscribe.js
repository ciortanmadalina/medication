const { readDB, writeDB } = require('./db-helper');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const subscription = JSON.parse(event.body);
    const db = await readDB();

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
    await writeDB(db);

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
