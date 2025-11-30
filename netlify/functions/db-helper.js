const { getStore } = require('@netlify/blobs');
const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Default database structure - starts with just one medication
const DEFAULT_DB = {
  subscriptions: [],
  doses: {
    config: [
      { id: "D1", label: "Morning - Vitamin D", time: "08:00" }
    ],
    today: []
  },
  snoozes: []
};

// Read database (tries Netlify Blobs first, falls back to file system)
async function readDB() {
  // Try Netlify Blobs (production)
  if (process.env.NETLIFY) {
    try {
      const store = getStore('medication-db');
      const data = await store.get('db', { type: 'json' });
      if (data) return data;
    } catch (error) {
      console.log('Blobs not available, trying file system');
    }
  }
  
  // Try local file system (development)
  try {
    const content = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.log('No existing database, using default');
    return JSON.parse(JSON.stringify(DEFAULT_DB)); // Deep clone
  }
}

// Write database (tries Netlify Blobs first, falls back to file system)
async function writeDB(db) {
  // Try Netlify Blobs (production)
  if (process.env.NETLIFY) {
    try {
      const store = getStore('medication-db');
      await store.setJSON('db', db);
      return true;
    } catch (error) {
      console.error('Failed to write to Blobs:', error.message);
    }
  }
  
  // Try local file system (development)
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to write to file:', error.message);
    return false;
  }
}

module.exports = { readDB, writeDB, DEFAULT_DB };
