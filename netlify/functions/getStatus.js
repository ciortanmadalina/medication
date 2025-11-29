const { readDB } = require('./db-helper');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const db = await readDB();

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
