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

    // Add new medication
    db.doses.config.push(medication);

    // Save database
    await writeDB(db);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Medication added successfully',
        medication
      })
    };
  } catch (error) {
    console.error('Add medication error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
