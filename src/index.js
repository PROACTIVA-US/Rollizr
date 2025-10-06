/**
 * Rollizr - AI-Native M&A Platform
 * Main entry point
 */

const AgentOrchestrator = require('./workflows/orchestrator');
const {
  ScoutAgent,
  ResolverAgent,
  ProfilerAgent,
  ValuationAgent,
  ComplianceAgent,
  OutreachAgent,
  DiligenceAgent,
  IntegratorAgent,
} = require('./agents');

// Export everything for library usage
module.exports = {
  // Orchestrator
  AgentOrchestrator,

  // Individual Agents
  ScoutAgent,
  ResolverAgent,
  ProfilerAgent,
  ValuationAgent,
  ComplianceAgent,
  OutreachAgent,
  DiligenceAgent,
  IntegratorAgent,
};

// If run directly, show usage info
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🎯 Rollizr - AI-Native M&A Platform                          ║
║                                                                ║
║  Fragmented Industry Rollup Platform (FIRP)                   ║
║  Powered by Claude AI Agents                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Available Agents:
  🔍 Scout Agent       - Find and score acquisition targets
  🔗 Resolver Agent    - Entity resolution and deduplication
  📊 Profiler Agent    - Build detailed company profiles
  💰 Valuation Agent   - Estimate company valuations
  ⚖️  Compliance Agent - Monitor regulatory compliance
  📧 Outreach Agent    - Generate personalized outreach
  📋 Diligence Agent   - Due diligence and IC memos
  🔄 Integrator Agent  - Post-acquisition integration

Workflows:
  • Sourcing Workflow     - Scout → Profile → Valuation → Compliance
  • Outreach Workflow     - Compliance → Outreach → Send
  • Diligence Workflow    - Document analysis → IC memo
  • Integration Workflow  - 100-day plan → KPI tracking

Usage:
  const { AgentOrchestrator } = require('./src');
  const orchestrator = new AgentOrchestrator();

  // Execute single agent
  const result = await orchestrator.executeAgent('scout', data);

  // Execute full sourcing workflow
  const analysis = await orchestrator.executeSourcingWorkflow(thesis, company);

Configuration:
  1. Copy .env.example to .env
  2. Add your ANTHROPIC_API_KEY
  3. Start building!

Documentation:
  See README.md and CLAUDE.md for more details.
  PRD: Rollizer PRD.txt

`);
}
