const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Read database
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

    // Calculate status for each dose
    const now = new Date();
    const dosesWithStatus = db.doses.config.map(config => {
      const todayDose = db.doses.today.find(d => d.id === config.id);
      
      let status = 'pending';
      if (todayDose) {
        if (todayDose.takenAtISO) {
          status = 'taken';
        } else if (new Date(todayDose.dueAtISO) < now) {
          status = 'overdue';
        }
      }

      return {
        ...config,
        status,
        dueAtISO: todayDose?.dueAtISO || null,
        takenAtISO: todayDose?.takenAtISO || null
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doses: dosesWithStatus,
        subscriptionCount: db.subscriptions.length
      })
    };
  } catch (error) {
    console.error('Get status error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
