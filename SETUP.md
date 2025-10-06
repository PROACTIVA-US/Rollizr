# Rollizr Setup Guide

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** (comes with Node.js)
- **Anthropic API Key** - Get one at https://console.anthropic.com/

## Installation Steps

### 1. Clone and Install

```bash
cd Rollizr
npm install
```

### 2. Configure Environment

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...
CLAUDE_MODEL=claude-sonnet-4-5-20250929
MAX_TOKENS=4096
TEMPERATURE=0.7
```

### 3. Verify Installation

Run the info command to verify everything is set up:

```bash
npm start
```

You should see the Rollizr banner and agent list.

### 4. Run Demo Workflows

Try the example workflows to see the agents in action:

```bash
# Run sourcing workflow demo
npm run demo:sourcing

# Run outreach workflow demo
npm run demo:outreach
```

## Project Structure

```
Rollizr/
├── src/
│   ├── agents/              # Agent implementations
│   │   ├── base-agent.js    # Base agent class
│   │   └── index.js         # Agent factory
│   ├── config/
│   │   └── agents.js        # Agent configurations (8 agents)
│   ├── utils/
│   │   └── claude-client.js # Anthropic SDK wrapper
│   ├── workflows/
│   │   └── orchestrator.js  # Workflow orchestration
│   └── index.js             # Main entry point
├── examples/
│   ├── demo-sourcing.js     # Sourcing workflow example
│   └── demo-outreach.js     # Outreach workflow example
├── .env                     # Your environment config (not committed)
├── .env.example             # Environment template
└── package.json
```

## Available Agents

The platform includes 8 specialized agents:

1. **Scout Agent** - Finds and scores acquisition targets against investment thesis
2. **Resolver Agent** - Entity resolution and deduplication
3. **Profiler Agent** - Enriches company data with operational intelligence
4. **Valuation Agent** - Estimates company value using multiple methods
5. **Compliance Agent** - Ensures regulatory compliance (TCPA, CAN-SPAM, etc.)
6. **Outreach Agent** - Generates personalized, compliant communications
7. **Diligence Agent** - Manages due diligence and IC memos
8. **Integrator Agent** - Post-acquisition integration and 100-day plans

## Usage Examples

### Basic Agent Execution

```javascript
const { AgentOrchestrator } = require('./src');

const orchestrator = new AgentOrchestrator();

// Execute single agent
const result = await orchestrator.executeAgent('scout', {
  thesis: { /* criteria */ },
  companyData: { /* data */ }
});

console.log(result.output);
```

### Run Sourcing Workflow

```javascript
const result = await orchestrator.executeSourcingWorkflow(thesis, companyData);

if (result.qualified) {
  console.log('Company qualifies!');
  console.log('Score:', result.summary.score);
  console.log('Value:', result.summary.estimatedValue);
}
```

### Generate Outreach

```javascript
const result = await orchestrator.executeOutreachWorkflow(companyData, context);

if (result.success) {
  console.log('Subject:', result.outreachDraft.output.subject);
  console.log('Body:', result.outreachDraft.output.message_body);
}
```

## Workflows

### 1. Sourcing Workflow
Evaluates a company against investment thesis:
- Scout: Score company (0-100)
- Profiler: Build detailed profile
- Valuation: Estimate value
- Compliance: Check licenses and regulatory status

### 2. Outreach Workflow
Generates compliant outreach messages:
- Compliance: Validate contact permissions
- Outreach: Generate personalized message

### 3. Diligence Workflow (Coming Soon)
Manages due diligence process:
- Generate document request lists
- Analyze uploaded documents
- Produce IC memos

### 4. Integration Workflow (Coming Soon)
Post-acquisition integration:
- Create 100-day plans
- Set up KPI tracking
- Monitor integration progress

## Development Mode

For detailed logging, set environment to development:

```env
NODE_ENV=development
```

This will show detailed agent execution logs including:
- Timestamp
- Agent name and role
- Execution time
- Token usage
- Input/output previews

## Troubleshooting

### API Key Issues

If you get authentication errors:
1. Check that `.env` file exists
2. Verify `ANTHROPIC_API_KEY` is set correctly
3. Ensure no extra spaces or quotes around the key

### Module Not Found

If you get module errors:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Permission Errors

If you get permission errors on macOS/Linux:
```bash
chmod +x examples/*.js
```

## Next Steps

1. **Review the PRD** - Read `Rollizer PRD.txt` for complete product vision
2. **Explore Agent Configs** - Check `src/config/agents.js` for agent prompts
3. **Customize Workflows** - Modify `src/workflows/orchestrator.js`
4. **Build Your Own** - Create custom agents and workflows

## API Costs

Estimated costs per workflow (using Claude Sonnet 4.5):
- Sourcing workflow: ~$0.10-0.30 per company
- Outreach workflow: ~$0.05-0.10 per message
- Full pipeline: ~$0.20-0.50 per company

*Costs vary based on data complexity and response length*

## Support

- **Documentation**: See README.md and CLAUDE.md
- **PRD**: See Rollizer PRD.txt for product details
- **Market Analysis**: See hvac-consolidation-analysis.md

## Security Notes

- Never commit `.env` file to version control
- Keep API keys secure
- Use environment variables for all secrets
- Follow compliance guidelines in agent prompts

---

Ready to build the future of M&A! 🚀
