/**
 * Demo: M&A Sourcing Workflow
 * Shows how to use the agent system to evaluate an acquisition target
 */

require('dotenv').config();
const { AgentOrchestrator } = require('../src');

async function runSourcingDemo() {
  console.log('🚀 Rollizr M&A Sourcing Workflow Demo\n');

  // Initialize orchestrator
  const orchestrator = new AgentOrchestrator();

  // Define investment thesis (HVAC example from PRD)
  const thesis = {
    vertical: 'HVAC',
    geography: {
      states: ['FL', 'TX', 'CA'],
      preferred_metros: ['Miami', 'Tampa', 'Orlando', 'Houston', 'Dallas', 'Austin', 'San Diego'],
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

  // Example company data (would come from data ingestion layer)
  const companyData = {
    company_id: 'hvac_001',
    legal_name: 'Cool Breeze Air Conditioning & Heating LLC',
    dba: 'Cool Breeze HVAC',
    domain: 'coolbreezehvac.com',
    phone: '+1-305-555-0123',
    city: 'Miami',
    state: 'FL',
    zip: '33101',
    vertical: 'HVAC',
    years_in_business: 8,
    estimated_revenue: 5500000,
    estimated_employees: 22,
    google_reviews: {
      count: 342,
      average_rating: 4.7,
      recent_velocity: 'high', // 15+ reviews per month
    },
    services: [
      'AC Installation',
      'AC Repair',
      'Heating Services',
      'Maintenance Plans',
      'Emergency Service',
      'Commercial HVAC',
    ],
    service_hours: '24/7',
    tech_stack: {
      website: 'WordPress',
      scheduling: 'ServiceTitan',
      has_online_booking: true,
      has_financing: true,
    },
    licenses: [
      {
        type: 'HVAC Contractor',
        number: 'CAC1234567',
        state: 'FL',
        status: 'Active',
        expiration: '2026-12-31',
      },
    ],
    social: {
      facebook_followers: 1200,
      linkedin_company: true,
    },
  };

  try {
    // Execute the full sourcing workflow
    console.log('📊 Analyzing acquisition target...\n');
    const result = await orchestrator.executeSourcingWorkflow(thesis, companyData);

    // Display results
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                  SOURCING ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Company: ${companyData.legal_name}`);
    console.log(`Location: ${companyData.city}, ${companyData.state}`);
    console.log(`Vertical: ${companyData.vertical}\n`);

    if (result.qualified) {
      console.log('✅ STATUS: QUALIFIED FOR OUTREACH\n');
      console.log(`📈 Score: ${result.summary.score}/100\n`);

      if (result.summary.estimatedValue) {
        console.log('💰 Estimated Value:');
        console.log(`   Low:  $${result.summary.estimatedValue.low.toLocaleString()}`);
        console.log(`   Mid:  $${result.summary.estimatedValue.midpoint.toLocaleString()}`);
        console.log(`   High: $${result.summary.estimatedValue.high.toLocaleString()}\n`);
      }

      console.log('⭐ Top Signals:');
      result.summary.topSignals?.forEach((signal) => {
        console.log(`   • ${signal}`);
      });
      console.log();

      if (result.summary.risks && result.summary.risks.length > 0) {
        console.log('⚠️  Identified Risks:');
        result.summary.risks.forEach((risk) => {
          console.log(`   • ${risk}`);
        });
        console.log();
      }

      console.log('📋 Next Steps:');
      console.log('   1. Review detailed agent outputs below');
      console.log('   2. Run outreach workflow to contact owner');
      console.log('   3. If engaged, run diligence workflow');
    } else {
      console.log(`❌ STATUS: NOT QUALIFIED\n`);
      console.log(`Reason: ${result.reason}\n`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                  DETAILED AGENT OUTPUTS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Show detailed outputs from each agent
    if (result.results) {
      Object.entries(result.results).forEach(([agentName, agentResult]) => {
        console.log(`\n🤖 ${agentResult.agent}:`);
        console.log('─'.repeat(60));
        console.log(JSON.stringify(agentResult.output, null, 2));
      });
    }

    // Show workflow statistics
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('                  WORKFLOW STATISTICS');
    console.log('═══════════════════════════════════════════════════════\n');

    const stats = orchestrator.getStats();
    console.log(`Total Agent Executions: ${stats.totalExecutions}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Avg Execution Time: ${stats.avgExecutionTime.toFixed(0)}ms\n`);

    console.log('Executions by Agent:');
    Object.entries(stats.byAgent).forEach(([agent, data]) => {
      console.log(`   ${agent}: ${data.count} (${data.successes} successful)`);
    });

    console.log('\n✅ Demo completed!\n');
  } catch (error) {
    console.error('❌ Error running sourcing workflow:', error.message);
    console.error(error);
  }
}

// Run the demo
if (require.main === module) {
  runSourcingDemo().catch(console.error);
}

module.exports = runSourcingDemo;
