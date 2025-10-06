/**
 * Demo: Outreach Workflow
 * Shows how to generate compliant, personalized outreach messages
 */

require('dotenv').config();
const { AgentOrchestrator } = require('../src');

async function runOutreachDemo() {
  console.log('🚀 Rollizr Outreach Workflow Demo\n');

  const orchestrator = new AgentOrchestrator();

  // Company data from sourcing analysis
  const companyData = {
    company_id: 'hvac_001',
    legal_name: 'Cool Breeze Air Conditioning & Heating LLC',
    dba: 'Cool Breeze HVAC',
    domain: 'coolbreezehvac.com',
    city: 'Miami',
    state: 'FL',
    vertical: 'HVAC',
    contact: {
      owner_name: 'John Martinez',
      first_name: 'John',
      email: 'john@coolbreezehvac.com',
      phone: '+1-305-555-0123',
      consent_status: 'none', // none, email_ok, sms_ok, call_ok, all
      dnc_status: 'not_on_list',
      timezone: 'America/New_York',
    },
    highlights: {
      years_in_business: 8,
      google_reviews: 342,
      rating: 4.7,
      services_247: true,
      uses_servicetitan: true,
    },
  };

  // Context from previous sourcing analysis
  const context = {
    score: 87,
    top_signals: [
      '342 Google reviews with 4.7 rating showing strong reputation',
      '24/7 emergency service with fast response times',
      'Using ServiceTitan indicating operational sophistication',
      'Strong residential presence in growing Miami market',
    ],
    estimated_value: {
      midpoint: 22000000,
    },
  };

  try {
    console.log('📧 Generating personalized outreach...\n');

    const result = await orchestrator.executeOutreachWorkflow(companyData, context);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                  OUTREACH WORKFLOW RESULT');
    console.log('═══════════════════════════════════════════════════════\n');

    if (result.success) {
      console.log('✅ Outreach approved by compliance\n');

      // Show compliance check results
      console.log('⚖️  Compliance Check:');
      const compliance = result.complianceCheck.output;
      console.log(`   Status: ${compliance.approved ? 'APPROVED' : 'DENIED'}`);
      if (compliance.violations && compliance.violations.length > 0) {
        console.log('   Violations:');
        compliance.violations.forEach((v) => {
          console.log(`      • [${v.severity}] ${v.details}`);
        });
      } else {
        console.log('   No violations detected ✓');
      }
      console.log();

      // Show outreach message
      console.log('📧 Generated Outreach Message:');
      console.log('─'.repeat(60));
      const outreach = result.outreachDraft.output;

      if (typeof outreach === 'object' && outreach.subject) {
        console.log(`\nChannel: ${outreach.channel || 'email'}`);
        console.log(`Subject: ${outreach.subject}`);
        console.log(`Send Time: ${outreach.send_time || 'Next business day, 10am local'}`);
        console.log('\nMessage Body:');
        console.log('─'.repeat(60));
        console.log(outreach.message_body);
        console.log('─'.repeat(60));
        console.log(`\nSequence Step: ${outreach.sequence_step || 1}`);
        console.log(`Compliance Checked: ${outreach.compliance_checked ? 'Yes' : 'No'}`);
      } else {
        console.log(JSON.stringify(outreach, null, 2));
      }

      console.log('\n\n📋 Next Steps:');
      console.log('   1. Review message for accuracy');
      console.log('   2. Approve for sending (or edit)');
      console.log('   3. Schedule via email platform (SendGrid/HubSpot)');
      console.log('   4. Track open/reply in CRM');
      console.log('   5. Follow up with sequence step 2 if no response in 5 days');
    } else {
      console.log('❌ Outreach NOT approved\n');
      console.log(`Reason: ${result.reason}\n`);

      if (result.violations) {
        console.log('Violations:');
        result.violations.forEach((v) => {
          console.log(`   • [${v.severity}] ${v.rule}: ${v.details}`);
        });
      }
    }

    console.log('\n✅ Demo completed!\n');
  } catch (error) {
    console.error('❌ Error running outreach workflow:', error.message);
    console.error(error);
  }
}

// Run the demo
if (require.main === module) {
  runOutreachDemo().catch(console.error);
}

module.exports = runOutreachDemo;
