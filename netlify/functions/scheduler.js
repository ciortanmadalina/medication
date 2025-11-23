const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Helper to check if a dose is snoozed
function isSnoozed(doseId, snoozes) {
  const snooze = snoozes.find(s => s.doseId === doseId);
  if (!snooze) return false;
  return new Date(snooze.untilISO) > new Date();
}

// Helper to initialize today's doses if needed
function initializeTodaysDoses(db) {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if today's doses are already initialized
  if (db.doses.today.length > 0) {
    const firstDoseDate = db.doses.today[0].dueAtISO.split('T')[0];
    if (firstDoseDate === today) {
      return false; // Already initialized for today
    }
  }

  // Initialize today's doses
  db.doses.today = db.doses.config.map(dose => {
    const [hours, minutes] = dose.time.split(':');
    const dueDate = new Date();
    dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return {
      id: dose.id,
      dueAtISO: dueDate.toISOString(),
      takenAtISO: null,
      lastSentISO: null
    };
  });

  // Clear old snoozes
  db.snoozes = [];
  
  return true; // Doses were initialized
}

exports.handler = async (event) => {
  try {
    // Read database
    const dbContent = await fs.readFile(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

    // Initialize today's doses if needed
    const initialized = initializeTodaysDoses(db);
    if (initialized) {
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
      console.log('Initialized today\'s doses');
    }

    const now = new Date();
    const results = [];

    // Check each dose
    for (const dose of db.doses.today) {
      // Skip if already taken
      if (dose.takenAtISO) {
        continue;
      }

      // Skip if snoozed
      if (isSnoozed(dose.id, db.snoozes)) {
        continue;
      }

      const dueTime = new Date(dose.dueAtISO);
      
      // Skip if not yet due
      if (now < dueTime) {
        continue;
      }

      // Check if we should send (first time or 5+ minutes since last send)
      const shouldSend = !dose.lastSentISO || 
        (now - new Date(dose.lastSentISO)) > 5 * 60 * 1000;

      if (shouldSend) {
        // Send reminder
        try {
          const response = await fetch(
            `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendReminder`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ doseId: dose.id })
            }
          );

          if (response.ok) {
            dose.lastSentISO = now.toISOString();
            results.push({ doseId: dose.id, status: 'sent' });
          } else {
            results.push({ doseId: dose.id, status: 'failed', error: await response.text() });
          }
        } catch (error) {
          results.push({ doseId: dose.id, status: 'error', error: error.message });
        }
      }
    }

    // Save updated lastSentISO times
    if (results.length > 0) {
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        results
      })
    };
  } catch (error) {
    console.error('Scheduler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
