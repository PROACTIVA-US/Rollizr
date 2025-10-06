/**
 * Data Ingestion Pipeline
 * Orchestrates data collection from multiple sources
 */

const GoogleMapsScaper = require('../scrapers/google-maps');
const YelpScraper = require('../scrapers/yelp');
const Company = require('../db/models/company');
const db = require('../db/connection');
const { AgentOrchestrator } = require('../index');

class IngestionPipeline {
  constructor() {
    this.googleMaps = new GoogleMapsScaper();
    this.yelp = new YelpScraper();
    this.orchestrator = new AgentOrchestrator();
  }

  /**
   * Ingest HVAC companies for a location
   * @param {string} location - City, state (e.g., "Miami, FL")
   * @param {object} options - Options
   * @returns {Promise<object>} - Ingestion results
   */
  async ingestLocation(location, options = {}) {
    const {
      includeGoogleMaps = true,
      includeYelp = true,
      runResolver = true,
      runScoring = true,
      thesis = null,
    } = options;

    console.log(`\n🚀 Starting ingestion pipeline for ${location}`);
    console.log('═'.repeat(60));

    const results = {
      location,
      sources: {},
      companies: [],
      scores: [],
      stats: {},
    };

    try {
      // Step 1: Scrape from Google Maps
      if (includeGoogleMaps) {
        console.log('\n📍 Step 1: Scraping Google Maps...');
        const googleCompanies = await this.googleMaps.searchCompanies(location);
        results.sources.google_maps = googleCompanies;
        console.log(`   Found ${googleCompanies.length} companies from Google Maps`);
      }

      // Step 2: Scrape from Yelp
      if (includeYelp) {
        console.log('\n⭐ Step 2: Scraping Yelp...');
        const yelpCompanies = await this.yelp.searchBusinesses(location);
        results.sources.yelp = yelpCompanies;
        console.log(`   Found ${yelpCompanies.length} companies from Yelp`);
      }

      // Step 3: Merge and resolve entities
      console.log('\n🔗 Step 3: Entity Resolution...');
      const allCompanies = [
        ...(results.sources.google_maps || []),
        ...(results.sources.yelp || []),
      ];

      let resolvedCompanies = allCompanies;
      if (runResolver && allCompanies.length > 0) {
        resolvedCompanies = await this.resolveEntities(allCompanies);
        console.log(`   Resolved to ${resolvedCompanies.length} unique companies`);
      }

      // Step 4: Store in database
      console.log('\n💾 Step 4: Storing in database...');
      const savedCompanies = await this.saveCompanies(resolvedCompanies);
      results.companies = savedCompanies;
      console.log(`   Saved ${savedCompanies.length} companies to database`);

      // Step 5: Run scoring (if thesis provided)
      if (runScoring && thesis && savedCompanies.length > 0) {
        console.log('\n📊 Step 5: Scoring companies...');
        const scores = await this.scoreCompanies(savedCompanies, thesis);
        results.scores = scores;
        console.log(`   Scored ${scores.length} companies`);
      }

      // Generate stats
      results.stats = {
        total_scraped: allCompanies.length,
        total_resolved: resolvedCompanies.length,
        total_saved: savedCompanies.length,
        total_scored: results.scores.length,
        qualified: results.scores.filter((s) => s.score >= 50).length,
      };

      console.log('\n✅ Ingestion pipeline completed successfully!');
      console.log('═'.repeat(60));
      console.log('\n📈 Results:');
      console.log(`   Total Scraped: ${results.stats.total_scraped}`);
      console.log(`   Unique Companies: ${results.stats.total_resolved}`);
      console.log(`   Saved to DB: ${results.stats.total_saved}`);
      console.log(`   Scored: ${results.stats.total_scored}`);
      console.log(`   Qualified (≥50): ${results.stats.qualified}`);

      return results;
    } catch (error) {
      console.error('\n❌ Pipeline error:', error);
      throw error;
    }
  }

  /**
   * Resolve duplicate entities using Resolver Agent
   * @param {Array} companies - Raw company data
   * @returns {Promise<Array>} - Resolved companies
   */
  async resolveEntities(companies) {
    // Group by potential matches
    const potentialDuplicates = this.findPotentialDuplicates(companies);

    const resolved = [];
    const processed = new Set();

    for (const [key, group] of Object.entries(potentialDuplicates)) {
      if (group.length === 1) {
        // No duplicates, add directly
        if (!processed.has(group[0])) {
          resolved.push(group[0]);
          processed.add(group[0]);
        }
      } else {
        // Multiple potential matches - use Resolver Agent
        console.log(`   Resolving ${group.length} potential duplicates for: ${group[0].legal_name}`);

        const mergedCompany = await this.mergeCompanyData(group);
        resolved.push(mergedCompany);

        group.forEach((c) => processed.add(c));
      }
    }

    // Add any remaining companies not in groups
    companies.forEach((company) => {
      if (!processed.has(company)) {
        resolved.push(company);
      }
    });

    return resolved;
  }

  /**
   * Find potential duplicate companies
   * @param {Array} companies - Company array
   * @returns {object} - Grouped companies
   */
  findPotentialDuplicates(companies) {
    const groups = {};

    companies.forEach((company) => {
      // Create matching key based on phone or domain
      const key = company.phone || company.domain || company.legal_name.toLowerCase();

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(company);
    });

    return groups;
  }

  /**
   * Merge data from multiple sources for the same company
   * @param {Array} companyGroup - Array of company records
   * @returns {object} - Merged company data
   */
  async mergeCompanyData(companyGroup) {
    // Prefer Google Maps data as primary, enrich with Yelp
    const googleData = companyGroup.find((c) => c.data_source === 'google_maps');
    const yelpData = companyGroup.find((c) => c.data_source === 'yelp');

    const merged = { ...(googleData || yelpData) };

    // Merge review data
    if (googleData && yelpData) {
      merged.all_reviews = {
        google: googleData.google_reviews,
        yelp: yelpData.yelp_reviews,
        total_count: (googleData.google_reviews?.count || 0) + (yelpData.yelp_reviews?.count || 0),
        avg_rating:
          ((googleData.google_reviews?.average_rating || 0) +
            (yelpData.yelp_reviews?.average_rating || 0)) /
          2,
      };

      // Merge services
      merged.services = [
        ...new Set([...(googleData.services || []), ...(yelpData.services || [])]),
      ];

      // Store both IDs
      merged.google_place_id = googleData.google_place_id;
      merged.yelp_id = yelpData.yelp_id;
    }

    return merged;
  }

  /**
   * Save companies to database
   * @param {Array} companies - Company data array
   * @returns {Promise<Array>} - Saved companies
   */
  async saveCompanies(companies) {
    const saved = [];

    for (const companyData of companies) {
      try {
        // Store raw data in data_sources table
        const company = await Company.create({
          legal_name: companyData.legal_name,
          dba: companyData.dba,
          domain: companyData.domain,
          phone: companyData.phone,
          website: companyData.website,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          zip: companyData.zip,
          latitude: companyData.latitude,
          longitude: companyData.longitude,
          vertical: companyData.vertical || 'HVAC',
          business_status: companyData.business_status,
          estimated_revenue: companyData.estimated_revenue,
          estimated_employees: companyData.estimated_employees,
          years_in_business: companyData.years_in_business,
          google_place_id: companyData.google_place_id,
          yelp_id: companyData.yelp_id,
        });

        if (company) {
          // Store raw data source
          await this.saveDataSource(company.id, companyData);
          saved.push(company);
        }
      } catch (error) {
        console.error(`   Error saving ${companyData.legal_name}:`, error.message);
      }
    }

    return saved;
  }

  /**
   * Save raw data source
   * @param {string} companyId - Company UUID
   * @param {object} data - Raw data
   */
  async saveDataSource(companyId, data) {
    const query = `
      INSERT INTO data_sources (company_id, source_type, data, confidence)
      VALUES ($1, $2, $3, $4)
    `;

    await db.query(query, [companyId, data.data_source, JSON.stringify(data.raw_data || data), 0.8]);
  }

  /**
   * Score companies using Scout Agent
   * @param {Array} companies - Company array
   * @param {object} thesis - Investment thesis
   * @returns {Promise<Array>} - Scores
   */
  async scoreCompanies(companies, thesis) {
    const scores = [];

    for (const company of companies) {
      try {
        console.log(`   Scoring ${company.legal_name}...`);

        const result = await this.orchestrator.executeAgent('scout', {
          thesis,
          companyData: company,
        });

        if (result.success && result.output.score !== undefined) {
          // Save score to database
          const query = `
            INSERT INTO scores (company_id, thesis_id, total, weights, rationale, top_signals)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (company_id, thesis_id) DO UPDATE
            SET total = $3, weights = $4, rationale = $5, top_signals = $6
            RETURNING *
          `;

          // For now, use null thesis_id - should create thesis first in production
          const scoreResult = await db.query(query, [
            company.id,
            null,
            result.output.score,
            JSON.stringify(result.output.weights || {}),
            result.output.rationale,
            result.output.top_signals || [],
          ]);

          scores.push({
            company_id: company.id,
            company_name: company.legal_name,
            score: result.output.score,
            ...result.output,
          });
        }
      } catch (error) {
        console.error(`   Error scoring ${company.legal_name}:`, error.message);
      }
    }

    return scores;
  }

  /**
   * Ingest multiple locations in batch
   * @param {Array} locations - Array of location strings
   * @param {object} options - Options
   * @returns {Promise<Array>} - Results for each location
   */
  async ingestMultipleLocations(locations, options = {}) {
    const results = [];

    for (const location of locations) {
      try {
        const result = await this.ingestLocation(location, options);
        results.push(result);

        // Delay between locations to respect rate limits
        await this.sleep(2000);
      } catch (error) {
        console.error(`Error ingesting ${location}:`, error);
        results.push({
          location,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = IngestionPipeline;
