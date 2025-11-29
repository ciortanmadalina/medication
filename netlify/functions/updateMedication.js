const { readDB, writeDB } = require('./db-helper');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const medication = JSON.parse(event.body);
    
    // Validate
    if (!medication.id || !medication.label || !medication.time) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: id, label, time' })
      };
    }

    const db = await readDB();

    // Find and update medication
    const index = db.doses.config.findIndex(m => m.id === medication.id);
    
    if (index === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Medication not found' })
      };
    }

    db.doses.config[index] = medication;

    // Update today's doses if they exist
    const todayIndex = db.doses.today.findIndex(d => d.id === medication.id);
    if (todayIndex !== -1) {
      const [hours, minutes] = medication.time.split(':');
      const dueDate = new Date();
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      db.doses.today[todayIndex].dueAtISO = dueDate.toISOString();
    }

    // Save database
    await writeDB(db);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Medication updated successfully',
        medication
      })
    };
  } catch (error) {
    console.error('Update medication error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
