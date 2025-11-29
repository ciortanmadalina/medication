const { readDB, writeDB } = require('./db-helper');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { doseId } = JSON.parse(event.body);
    const db = await readDB();

    // Find and mark dose as taken
    const doseIndex = db.doses.today.findIndex(d => d.id === doseId);
    
    if (doseIndex === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Dose not found' })
      };
    }

    db.doses.today[doseIndex].takenAtISO = new Date().toISOString();

    // Remove any snoozes for this dose
    db.snoozes = db.snoozes.filter(s => s.doseId !== doseId);

    // Save database
    await writeDB(db);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Dose marked as taken',
        dose: db.doses.today[doseIndex]
      })
    };
  } catch (error) {
    console.error('Mark dose taken error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
