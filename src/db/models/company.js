/**
 * Company Model
 * Database operations for companies
 */

const db = require('../connection');

class Company {
  /**
   * Create a new company
   * @param {object} data - Company data
   * @returns {Promise<object>} - Created company
   */
  static async create(data) {
    const {
      legal_name,
      dba,
      domain,
      phone,
      website,
      email,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      naics,
      vertical,
      business_status,
      estimated_revenue,
      estimated_employees,
      years_in_business,
      google_place_id,
      yelp_id,
      data_quality_score,
    } = data;

    const query = `
      INSERT INTO companies (
        legal_name, dba, domain, phone, website, email,
        address, city, state, zip, latitude, longitude,
        naics, vertical, business_status,
        estimated_revenue, estimated_employees, years_in_business,
        google_place_id, yelp_id, data_quality_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      legal_name,
      dba || legal_name,
      domain,
      phone,
      website,
      email,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      naics,
      vertical,
      business_status || 'OPERATIONAL',
      estimated_revenue,
      estimated_employees,
      years_in_business,
      google_place_id,
      yelp_id,
      data_quality_score,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        console.error('Company already exists:', error.detail);
        return null;
      }
      throw error;
    }
  }

  /**
   * Find company by ID
   * @param {string} id - Company UUID
   * @returns {Promise<object>} - Company data
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
    return result.rows[0];
  }

  /**
   * Find company by domain
   * @param {string} domain - Company domain
   * @returns {Promise<object>} - Company data
   */
  static async findByDomain(domain) {
    const result = await db.query('SELECT * FROM companies WHERE domain = $1', [domain]);
    return result.rows[0];
  }

  /**
   * Find companies by location
   * @param {string} city - City name
   * @param {string} state - State code
   * @returns {Promise<Array>} - Array of companies
   */
  static async findByLocation(city, state) {
    const result = await db.query(
      'SELECT * FROM companies WHERE city ILIKE $1 AND state = $2',
      [city, state]
    );
    return result.rows;
  }

  /**
   * Find companies by vertical
   * @param {string} vertical - Industry vertical
   * @returns {Promise<Array>} - Array of companies
   */
  static async findByVertical(vertical) {
    const result = await db.query('SELECT * FROM companies WHERE vertical = $1', [vertical]);
    return result.rows;
  }

  /**
   * Search companies by name (fuzzy)
   * @param {string} name - Company name
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} - Array of companies
   */
  static async searchByName(name, limit = 10) {
    const query = `
      SELECT *, similarity(legal_name, $1) AS similarity_score
      FROM companies
      WHERE legal_name % $1
      ORDER BY similarity_score DESC
      LIMIT $2
    `;
    const result = await db.query(query, [name, limit]);
    return result.rows;
  }

  /**
   * Update company
   * @param {string} id - Company UUID
   * @param {object} data - Updated data
   * @returns {Promise<object>} - Updated company
   */
  static async update(id, data) {
    // Build dynamic update query
    const fields = Object.keys(data);
    const values = Object.values(data);

    const setClause = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');

    const query = `
      UPDATE companies
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  /**
   * Delete company
   * @param {string} id - Company UUID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM companies WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get companies with scores
   * @param {number} minScore - Minimum score threshold
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} - Companies with scores
   */
  static async getWithScores(minScore = 0, limit = 100) {
    const query = `
      SELECT c.*, s.total as score, s.top_signals, s.rationale
      FROM companies c
      LEFT JOIN scores s ON c.id = s.company_id
      WHERE s.total >= $1
      ORDER BY s.total DESC
      LIMIT $2
    `;
    const result = await db.query(query, [minScore, limit]);
    return result.rows;
  }

  /**
   * Bulk insert companies
   * @param {Array} companies - Array of company data objects
   * @returns {Promise<number>} - Number of companies inserted
   */
  static async bulkInsert(companies) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      let insertedCount = 0;

      for (const company of companies) {
        try {
          await this.create(company);
          insertedCount++;
        } catch (error) {
          if (error.code === '23505') {
            // Skip duplicates
            console.log(`Skipping duplicate: ${company.legal_name}`);
          } else {
            console.error(`Error inserting ${company.legal_name}:`, error.message);
          }
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Inserted ${insertedCount} companies`);
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get company statistics
   * @returns {Promise<object>} - Statistics
   */
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_companies,
        COUNT(DISTINCT vertical) as verticals,
        COUNT(DISTINCT state) as states,
        AVG(estimated_revenue) as avg_revenue,
        AVG(estimated_employees) as avg_employees
      FROM companies
    `;
    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = Company;
