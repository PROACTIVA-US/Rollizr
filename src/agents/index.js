/**
 * Agent Factory
 * Creates and exports all agent instances
 */

const BaseAgent = require('./base-agent');
const { AGENT_CONFIGS } = require('../config/agents');

// Create agent instances
const agents = {};

for (const [key, config] of Object.entries(AGENT_CONFIGS)) {
  agents[key] = new BaseAgent(config);
}

// Export individual agents
const {
  scout,
  resolver,
  profiler,
  valuation,
  compliance,
  outreach,
  diligence,
  integrator,
} = agents;

module.exports = {
  // Individual agents
  ScoutAgent: scout,
  ResolverAgent: resolver,
  ProfilerAgent: profiler,
  ValuationAgent: valuation,
  ComplianceAgent: compliance,
  OutreachAgent: outreach,
  DiligenceAgent: diligence,
  IntegratorAgent: integrator,

  // All agents as object
  agents,

  // Agent configs
  AGENT_CONFIGS,
};
