const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { doseId, minutes = 10 } = JSON.parse(event.body);
    
    // Read database
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

    const untilISO = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    // Remove existing snooze for this dose
    db.snoozes = db.snoozes.filter(s => s.doseId !== doseId);

    // Add new snooze
    db.snoozes.push({ doseId, untilISO });

    // Save database
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

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
