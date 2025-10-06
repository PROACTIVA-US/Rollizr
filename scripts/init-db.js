/**
 * Database Initialization Script
 * Sets up the PostgreSQL schema
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function initDatabase() {
  console.log('🗄️  Initializing Rollizr Database\n');

  try {
    // Check connection
    console.log('1. Checking database connection...');
    const connected = await db.healthCheck();

    if (!connected) {
      throw new Error('Database connection failed. Check your DATABASE_URL in .env');
    }

    // Initialize schema
    console.log('\n2. Creating database schema...');
    await db.initSchema();

    console.log('\n✅ Database initialized successfully!');
    console.log('\nYou can now run the ingestion pipeline.\n');
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is installed and running');
    console.error('2. Create the database: createdb rollizr');
    console.error('3. Check DATABASE_URL in .env file');
    console.error('4. Verify PostgreSQL credentials\n');
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run initialization
initDatabase();
