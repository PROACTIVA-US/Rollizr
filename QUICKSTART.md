# Rollizr Quick Start Guide

## ✅ Installation Complete!

Your Rollizr AI agent system is ready to use. Here's what's been set up:

## 📦 What's Installed

### 8 Specialized AI Agents

1. **🔍 Scout Agent** - Finds and scores acquisition targets (temp: 0.3)
2. **🔗 Resolver Agent** - Entity resolution and deduplication (temp: 0.2)
3. **📊 Profiler Agent** - Company enrichment and profiling (temp: 0.4)
4. **💰 Valuation Agent** - Business valuation with multiple methods (temp: 0.3)
5. **⚖️ Compliance Agent** - Regulatory and compliance checks (temp: 0.1)
6. **📧 Outreach Agent** - Personalized, compliant communications (temp: 0.6)
7. **📋 Diligence Agent** - Due diligence and IC memos (temp: 0.3)
8. **🔄 Integrator Agent** - Post-acquisition integration (temp: 0.4)

### 4 Pre-Built Workflows

- **Sourcing Workflow** - Complete target evaluation pipeline
- **Outreach Workflow** - Compliant message generation
- **Diligence Workflow** - Due diligence management
- **Integration Workflow** - Post-close integration planning

### Core Infrastructure

- Agent orchestrator with pipeline and parallel execution
- Claude client wrapper with JSON parsing
- Base agent class for easy extension
- Example demos and documentation

## 🚀 Get Started in 3 Steps

### Step 1: Add Your API Key

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Get an API key at: https://console.anthropic.com/

### Step 2: Run a Demo

```bash
# Run the sourcing workflow demo
npm run demo:sourcing

# Run the outreach workflow demo
npm run demo:outreach
```

### Step 3: Build Your Own

```javascript
const { AgentOrchestrator } = require('./src');

const orchestrator = new AgentOrchestrator();

// Define your investment thesis
const thesis = {
  vertical: 'HVAC',
  geography: { states: ['FL', 'TX'] },
  financials: {
    revenue_min: 2000000,
    revenue_max: 10000000
  }
};

// Company to evaluate
const company = {
  company_id: 'hvac_001',
  legal_name: 'Cool Breeze HVAC',
  // ... more data
};

// Run sourcing analysis
const result = await orchestrator.executeSourcingWorkflow(thesis, company);

if (result.qualified) {
  console.log(`Score: ${result.summary.score}/100`);
  console.log(`Value: $${result.summary.estimatedValue.midpoint}`);
}
```

## 💡 Agent Usage Examples

### Single Agent

```javascript
// Execute Scout agent
const result = await orchestrator.executeAgent('scout', {
  thesis: myThesis,
  companyData: myCompany
});

console.log(result.output.score);
console.log(result.output.rationale);
```

### Pipeline (Sequential)

```javascript
// Scout → Profiler → Valuation
const result = await orchestrator.executePipeline(
  ['scout', 'profiler', 'valuation'],
  companyData
);
```

### Parallel Execution

```javascript
// Run multiple agents simultaneously
const result = await orchestrator.executeParallel(
  ['profiler', 'compliance', 'valuation'],
  companyData
);
```

### Full Workflow

```javascript
// Complete sourcing workflow
const result = await orchestrator.executeSourcingWorkflow(
  thesis,
  companyData
);

// Generate outreach message
const outreach = await orchestrator.executeOutreachWorkflow(
  companyData,
  { scoutAnalysis: result.summary }
);
```

## 📊 Example Output

When you run the sourcing workflow, you'll get:

```json
{
  "success": true,
  "qualified": true,
  "summary": {
    "score": 87,
    "estimatedValue": {
      "low": 18500000,
      "midpoint": 22000000,
      "high": 27500000
    },
    "topSignals": [
      "342 Google reviews with 4.7 rating",
      "24/7 emergency service",
      "Using ServiceTitan (operational maturity)"
    ],
    "risks": [
      "Technician retention in competitive market",
      "Warranty liability exposure"
    ]
  }
}
```

## 🛠 Customization

### Add Custom Agent

Edit `src/config/agents.js`:

```javascript
my_agent: {
  name: "My Custom Agent",
  role: "custom_role",
  description: "What this agent does",
  systemPrompt: "You are a specialized agent that...",
  maxTokens: 4096,
  temperature: 0.5,
}
```

The agent will be automatically available!

### Create Custom Workflow

Edit `src/workflows/orchestrator.js`:

```javascript
async executeCustomWorkflow(data) {
  const step1 = await this.executeAgent('agent1', data);
  const step2 = await this.executeAgent('agent2', data, {
    previousResult: step1.output
  });
  return { step1, step2 };
}
```

## 📁 File Structure

```
src/
├── agents/
│   ├── base-agent.js     # Base class for all agents
│   └── index.js          # Agent factory
├── config/
│   └── agents.js         # Agent configs & prompts ⭐
├── utils/
│   └── claude-client.js  # Anthropic SDK wrapper
├── workflows/
│   └── orchestrator.js   # Workflow orchestration ⭐
└── index.js              # Main entry

examples/
├── demo-sourcing.js      # Sourcing workflow example
└── demo-outreach.js      # Outreach workflow example
```

## 🎯 Next Steps

1. **Review the PRD** - `Rollizer PRD.txt` has the complete product vision
2. **Customize Agents** - Edit prompts in `src/config/agents.js`
3. **Build Workflows** - Create custom orchestrations
4. **Add Data Sources** - Connect to APIs, databases, web scrapers
5. **Build UI** - Create a Next.js frontend

## 📚 Documentation

- **[README.md](./README.md)** - Full documentation
- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[CLAUDE.md](./CLAUDE.md)** - Architecture guidelines
- **[Rollizer PRD.txt](./Rollizer%20PRD.txt)** - Product requirements
- **[hvac-consolidation-analysis.md](./hvac-consolidation-analysis.md)** - Market analysis

## 💰 Cost Estimates

Using Claude Sonnet 4.5:
- **Sourcing workflow**: ~$0.10-0.30 per company
- **Outreach workflow**: ~$0.05-0.10 per message
- **Full pipeline**: ~$0.20-0.50 per company

## 🔐 Security

- Never commit `.env` file
- Keep API keys secure
- Follow compliance guidelines in agent prompts
- Implement audit logging for production

## ❓ Troubleshooting

**Can't find module errors?**
```bash
npm install
```

**API authentication errors?**
- Check `.env` file exists
- Verify `ANTHROPIC_API_KEY` is correct
- No spaces or quotes around the key

**Need more logging?**
```env
NODE_ENV=development
```

## 🚀 You're Ready!

Your AI agent system is fully operational. Run the demos, explore the code, and start building your M&A platform!

```bash
npm run demo:sourcing
```

Happy building! 🎉
