const { readDB, writeDB } = require('./db-helper');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id } = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: id' })
      };
    }

    const db = await readDB();

    // Find and remove medication
    const index = db.doses.config.findIndex(m => m.id === id);
    
    if (index === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Medication not found' })
      };
    }

    db.doses.config.splice(index, 1);

    // Remove from today's doses
    db.doses.today = db.doses.today.filter(d => d.id !== id);

    // Remove any snoozes
    db.snoozes = db.snoozes.filter(s => s.doseId !== id);

    // Save database
    await writeDB(db);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Medication deleted successfully'
      })
    };
  } catch (error) {
    console.error('Delete medication error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
