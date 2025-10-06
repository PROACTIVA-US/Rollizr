/**
 * Demo: Data Ingestion Pipeline
 * Complete example of scraping, resolving, storing, and scoring HVAC companies
 */

require('dotenv').config();
const IngestionPipeline = require('../src/ingestion/pipeline');
const db = require('../src/db/connection');

async function runIngestionDemo() {
  console.log('🚀 Rollizr Data Ingestion Pipeline Demo\n');

  // Initialize pipeline
  const pipeline = new IngestionPipeline();

  // Define investment thesis for HVAC (from PRD)
  const hvacThesis = {
    vertical: 'HVAC',
    geography: {
      states: ['FL', 'TX', 'CA'],
      preferred_metros: ['Miami', 'Tampa', 'Orlando', 'Houston', 'Dallas', 'Austin'],
    },
    financials: {
      revenue_min: 2000000,
      revenue_max: 10000000,
      residential_mix_min: 0.6,
      ebitda_margin_min: 0.15,
    },
    operations: {
      require_24_7: true,
      min_technicians: 3,
      require_emergency_service: true,
      min_reviews: 200,
    },
    required: {
      licenses_good_standing: true,
      no_major_complaints: true,
      established_years_min: 3,
    },
  };

  try {
    // Check database connection
    console.log('📡 Checking database connection...');
    const connected = await db.healthCheck();

    if (!connected) {
      console.log('\n⚠️  Database not connected. Make sure PostgreSQL is running.');
      console.log('   To set up the database:');
      console.log('   1. Install PostgreSQL');
      console.log('   2. Create database: createdb rollizr');
      console.log('   3. Run: npm run db:init');
      console.log('\n   For now, we\'ll just scrape data without storing it.\n');
    }

    // Locations to scrape (start small for demo)
    const locations = [
      'Miami, FL',
      // 'Tampa, FL',
      // 'Orlando, FL',
    ];

    console.log(`\n📍 Target Locations: ${locations.join(', ')}`);
    console.log(`🎯 Vertical: ${hvacThesis.vertical}`);
    console.log(`💰 Revenue Range: $${hvacThesis.financials.revenue_min.toLocaleString()} - $${hvacThesis.financials.revenue_max.toLocaleString()}\n`);

    // Run ingestion pipeline
    const results = await pipeline.ingestLocation(locations[0], {
      includeGoogleMaps: true,
      includeYelp: true,
      runResolver: true,
      runScoring: connected, // Only score if DB is available
      thesis: hvacThesis,
    });

    // Display results
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('                  INGESTION RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`📊 Statistics:`);
    console.log(`   Total Scraped: ${results.stats.total_scraped}`);
    console.log(`   Unique Companies: ${results.stats.total_resolved}`);
    if (connected) {
      console.log(`   Saved to Database: ${results.stats.total_saved}`);
      console.log(`   Scored: ${results.stats.total_scored}`);
      console.log(`   Qualified (≥50): ${results.stats.qualified}`);
    }

    // Show top companies
    if (results.companies.length > 0) {
      console.log(`\n📋 Sample Companies:`);
      results.companies.slice(0, 5).forEach((company, idx) => {
        console.log(`\n   ${idx + 1}. ${company.legal_name}`);
        console.log(`      Location: ${company.city}, ${company.state}`);
        console.log(`      Phone: ${company.phone || 'N/A'}`);
        console.log(`      Website: ${company.website || 'N/A'}`);

        const score = results.scores.find((s) => s.company_id === company.id);
        if (score) {
          console.log(`      Score: ${score.score}/100`);
          if (score.top_signals && score.top_signals.length > 0) {
            console.log(`      Top Signals:`);
            score.top_signals.slice(0, 2).forEach((signal) => {
              console.log(`         • ${signal}`);
            });
          }
        }
      });
    }

    // Show qualified companies
    const qualified = results.scores.filter((s) => s.score >= 50);
    if (qualified.length > 0) {
      console.log(`\n\n✅ Qualified Companies (Score ≥ 50):`);
      console.log('─'.repeat(60));

      qualified.forEach((score, idx) => {
        const company = results.companies.find((c) => c.id === score.company_id);
        console.log(`\n${idx + 1}. ${score.company_name} - ${score.score}/100`);
        console.log(`   Location: ${company.city}, ${company.state}`);

        if (score.top_signals) {
          console.log(`   Strengths:`);
          score.top_signals.forEach((signal) => {
            console.log(`      • ${signal}`);
          });
        }

        if (score.risks && score.risks.length > 0) {
          console.log(`   Risks:`);
          score.risks.forEach((risk) => {
            console.log(`      ⚠️  ${risk}`);
          });
        }
      });
    }

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('                  NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('1. Review qualified companies');
    console.log('2. Run Profiler agent for detailed enrichment');
    console.log('3. Run Valuation agent for estimated values');
    console.log('4. Run Outreach workflow for top candidates');
    console.log('5. Export to CRM or IC memo');

    if (!connected) {
      console.log('\n⚠️  Set up the database to persist results and run scoring!');
    }

    console.log('\n✅ Demo completed!\n');
  } catch (error) {
    console.error('\n❌ Error running ingestion demo:', error.message);
    console.error(error);
  } finally {
    // Close database connection
    await db.close();
  }
}

// Run the demo
if (require.main === module) {
  runIngestionDemo().catch(console.error);
}

module.exports = runIngestionDemo;
