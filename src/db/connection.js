/**
 * Database Connection Manager
 * PostgreSQL connection and query utilities
 */

const { Pool } = require('pg');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool settings
      max: 20, // maximum number of clients
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  /**
   * Execute a query
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise} - Query result
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
      }

      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   * @returns {Promise} - Database client
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Close all connections
   */
  async close() {
    await this.pool.end();
  }

  /**
   * Initialize database schema
   * Runs schema.sql file
   */
  async initSchema() {
    const fs = require('fs');
    const path = require('path');

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      await this.query(schema);
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing schema:', error);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as time');
      console.log('✅ Database connected:', result.rows[0].time);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const db = new Database();

module.exports = db;
