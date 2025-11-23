const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { doseId } = JSON.parse(event.body);
    
    // Read database
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

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
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

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
