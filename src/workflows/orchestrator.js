/**
 * Agent Orchestrator
 * Manages multi-agent workflows and coordination
 */

const { agents } = require('../agents');

class AgentOrchestrator {
  constructor() {
    this.agents = agents;
    this.workflowHistory = [];
  }

  /**
   * Execute a single agent
   * @param {string} agentKey - The agent key (scout, resolver, etc.)
   * @param {any} input - Input data for the agent
   * @param {object} context - Additional context
   * @returns {Promise<object>} - Agent execution result
   */
  async executeAgent(agentKey, input, context = {}) {
    const agent = this.agents[agentKey];
    if (!agent) {
      throw new Error(`Agent '${agentKey}' not found`);
    }

    console.log(`\n🤖 Executing ${agent.name}...`);
    const result = await agent.execute(input, context);

    this.workflowHistory.push({
      agent: agentKey,
      timestamp: new Date().toISOString(),
      success: result.success,
      executionTime: result.metadata.executionTime,
    });

    return result;
  }

  /**
   * Execute a sequence of agents (pipeline)
   * Each agent receives the output of the previous agent as context
   * @param {array} agentSequence - Array of agent keys
   * @param {any} initialInput - Starting input
   * @returns {Promise<object>} - Final result with all agent outputs
   */
  async executePipeline(agentSequence, initialInput) {
    console.log(`\n🔄 Starting pipeline with ${agentSequence.length} agents...`);

    const results = [];
    let currentInput = initialInput;
    let context = {};

    for (const agentKey of agentSequence) {
      const result = await this.executeAgent(agentKey, currentInput, context);

      results.push(result);

      if (!result.success) {
        console.error(`❌ Pipeline failed at ${result.agent}`);
        return {
          success: false,
          failedAt: result.agent,
          results,
          error: result.error,
        };
      }

      // Pass output to next agent as context
      context[result.role] = result.output;
      currentInput = result.output;
    }

    console.log(`✅ Pipeline completed successfully`);

    return {
      success: true,
      results,
      finalOutput: results[results.length - 1].output,
      context,
    };
  }

  /**
   * Execute agents in parallel
   * @param {array} agentKeys - Array of agent keys to run in parallel
   * @param {any} input - Input data (same for all agents)
   * @param {object} context - Shared context
   * @returns {Promise<object>} - Results from all agents
   */
  async executeParallel(agentKeys, input, context = {}) {
    console.log(`\n⚡ Executing ${agentKeys.length} agents in parallel...`);

    const promises = agentKeys.map((agentKey) =>
      this.executeAgent(agentKey, input, context)
    );

    const results = await Promise.all(promises);

    const success = results.every((r) => r.success);

    return {
      success,
      results,
      outputs: results.reduce((acc, r) => {
        acc[r.role] = r.output;
        return acc;
      }, {}),
    };
  }

  /**
   * Execute M&A sourcing workflow (Scout → Profiler → Valuation → Compliance)
   * @param {object} thesis - Investment thesis criteria
   * @param {object} companyData - Raw company data
   * @returns {Promise<object>} - Complete sourcing analysis
   */
  async executeSourcingWorkflow(thesis, companyData) {
    console.log('\n🎯 Starting M&A Sourcing Workflow...');

    // Step 1: Scout - Score the company against thesis
    const scoutResult = await this.executeAgent('scout', {
      thesis,
      companyData,
    });

    if (!scoutResult.success || scoutResult.output.score < 50) {
      return {
        success: true,
        qualified: false,
        reason: 'Did not meet minimum score threshold',
        scoutResult,
      };
    }

    // Step 2: Profiler - Build detailed company profile
    const profilerResult = await this.executeAgent('profiler', companyData, {
      scoutAnalysis: scoutResult.output,
    });

    // Step 3: Valuation - Estimate company value (parallel with compliance)
    const [valuationResult, complianceResult] = await Promise.all([
      this.executeAgent('valuation', companyData, {
        scoutAnalysis: scoutResult.output,
        profile: profilerResult.output,
      }),
      this.executeAgent('compliance', companyData, {
        checkType: 'licensure',
      }),
    ]);

    // Check compliance
    if (!complianceResult.output.approved) {
      return {
        success: true,
        qualified: false,
        reason: 'Failed compliance checks',
        results: {
          scout: scoutResult,
          profiler: profilerResult,
          compliance: complianceResult,
        },
      };
    }

    console.log('✅ Sourcing workflow completed - Company qualified');

    return {
      success: true,
      qualified: true,
      results: {
        scout: scoutResult,
        profiler: profilerResult,
        valuation: valuationResult,
        compliance: complianceResult,
      },
      summary: {
        score: scoutResult.output.score,
        estimatedValue: valuationResult.output.estimated_value_range,
        topSignals: scoutResult.output.top_signals,
        risks: [
          ...scoutResult.output.risks,
          ...complianceResult.output.violations.map((v) => v.details),
        ],
      },
    };
  }

  /**
   * Execute outreach workflow (Compliance check → Outreach draft → Send)
   * @param {object} companyData - Company and contact info
   * @param {object} context - Previous analysis results
   * @returns {Promise<object>} - Outreach result
   */
  async executeOutreachWorkflow(companyData, context = {}) {
    console.log('\n📧 Starting Outreach Workflow...');

    // Step 1: Compliance check
    const complianceResult = await this.executeAgent('compliance', {
      entity_id: companyData.company_id,
      check_type: 'outreach',
      contact_info: companyData.contact,
    });

    if (!complianceResult.output.approved) {
      return {
        success: false,
        reason: 'Outreach not approved by compliance',
        violations: complianceResult.output.violations,
      };
    }

    // Step 2: Generate outreach message
    const outreachResult = await this.executeAgent('outreach', companyData, {
      ...context,
      complianceApproved: true,
    });

    console.log('✅ Outreach workflow completed');

    return {
      success: true,
      complianceCheck: complianceResult,
      outreachDraft: outreachResult,
    };
  }

  /**
   * Execute due diligence workflow
   * @param {object} companyData - Company information
   * @param {array} documents - Uploaded documents
   * @returns {Promise<object>} - Diligence report
   */
  async executeDiligenceWorkflow(companyData, documents = []) {
    console.log('\n📋 Starting Due Diligence Workflow...');

    const diligenceResult = await this.executeAgent('diligence', {
      company_id: companyData.company_id,
      documents,
      vertical: companyData.vertical,
    });

    return {
      success: true,
      diligenceReport: diligenceResult,
    };
  }

  /**
   * Execute post-acquisition integration workflow
   * @param {object} dealData - Deal and company information
   * @returns {Promise<object>} - Integration plan
   */
  async executeIntegrationWorkflow(dealData) {
    console.log('\n🔄 Starting Integration Workflow...');

    const integrationResult = await this.executeAgent('integrator', dealData);

    return {
      success: true,
      integrationPlan: integrationResult,
    };
  }

  /**
   * Get workflow history
   * @returns {array} - Workflow execution history
   */
  getHistory() {
    return this.workflowHistory;
  }

  /**
   * Clear workflow history
   */
  clearHistory() {
    this.workflowHistory = [];
  }

  /**
   * Get statistics about workflow executions
   * @returns {object} - Workflow statistics
   */
  getStats() {
    const stats = {
      totalExecutions: this.workflowHistory.length,
      byAgent: {},
      successRate: 0,
      avgExecutionTime: 0,
    };

    let successCount = 0;
    let totalTime = 0;

    this.workflowHistory.forEach((item) => {
      // Count by agent
      if (!stats.byAgent[item.agent]) {
        stats.byAgent[item.agent] = { count: 0, successes: 0 };
      }
      stats.byAgent[item.agent].count++;

      // Track successes
      if (item.success) {
        successCount++;
        stats.byAgent[item.agent].successes++;
      }

      // Sum execution times
      totalTime += item.executionTime;
    });

    stats.successRate =
      this.workflowHistory.length > 0
        ? (successCount / this.workflowHistory.length) * 100
        : 0;
    stats.avgExecutionTime =
      this.workflowHistory.length > 0
        ? totalTime / this.workflowHistory.length
        : 0;

    return stats;
  }
}

module.exports = AgentOrchestrator;
