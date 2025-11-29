const { readDB, writeDB } = require('./db-helper');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { doseId, minutes = 10 } = JSON.parse(event.body);
    const db = await readDB();

    const untilISO = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    // Remove existing snooze for this dose
    db.snoozes = db.snoozes.filter(s => s.doseId !== doseId);

    // Add new snooze
    db.snoozes.push({ doseId, untilISO });

    // Save database
    await writeDB(db);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Dose snoozed for ${minutes} minutes`,
        untilISO
      })
    };
  } catch (error) {
    console.error('Snooze dose error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
