# Rollizr - AI-Native M&A Platform

**Fragmented Industry Rollup Platform (FIRP)** powered by Claude AI agents.

## Overview

Rollizr is an AI-native platform that orchestrates intelligent agents to streamline M&A deal sourcing, evaluation, and execution across fragmented service industries. Built on Claude, the platform reduces weeks of manual research to minutes through automated workflows for target identification, valuation, compliant outreach, due diligence, and post-acquisition integration.

### Core Capabilities

- **🔍 Target Discovery** - Scout agent finds and scores companies against investment thesis
- **🔗 Entity Resolution** - Resolver agent deduplicates and merges company records
- **📊 Company Profiling** - Profiler agent enriches data with operational intelligence
- **💰 Valuation** - Valuation agent estimates value using multiple methodologies
- **⚖️ Compliance** - Compliance agent enforces regulatory requirements
- **📧 Outreach** - Outreach agent generates personalized, compliant communications
- **📋 Due Diligence** - Diligence agent manages document requests and IC memos
- **🔄 Integration** - Integrator agent creates 100-day plans and tracks KPIs

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Rollizr

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Environment Configuration

Create a `.env` file with:

```env
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5-20250929
MAX_TOKENS=4096
TEMPERATURE=0.7
```

### Running Examples

```bash
# Run sourcing workflow demo
node examples/demo-sourcing.js

# Run outreach workflow demo
node examples/demo-outreach.js
```

## Architecture

### Agent System

Rollizr uses a multi-agent architecture where specialized AI agents handle different aspects of the M&A workflow:

```
┌─────────────────────────────────────────────────────────┐
│                  Agent Orchestrator                     │
│  (Coordinates workflows and agent communication)        │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌───▼────┐      ┌───▼────┐
   │  Scout  │      │Profiler│      │Valuation│
   │  Agent  │      │ Agent  │      │ Agent   │
   └─────────┘      └────────┘      └─────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │Compliance│
                    │  Agent   │
                    └─────────┘
```

### Project Structure

```
Rollizr/
├── src/
│   ├── agents/              # Agent implementations
│   │   ├── base-agent.js    # Base agent class
│   │   └── index.js         # Agent factory
│   ├── config/
│   │   └── agents.js        # Agent configurations & prompts
│   ├── utils/
│   │   └── claude-client.js # Anthropic SDK wrapper
│   ├── workflows/
│   │   └── orchestrator.js  # Multi-agent orchestration
│   └── index.js             # Main entry point
├── examples/                # Example workflows
│   ├── demo-sourcing.js
│   └── demo-outreach.js
├── tests/                   # Tests (coming soon)
├── .env.example             # Environment template
├── package.json
├── CLAUDE.md                # AI assistant guidance
└── README.md
```

## Usage

### Single Agent Execution

```javascript
const { AgentOrchestrator } = require('./src');

const orchestrator = new AgentOrchestrator();

// Execute a single agent
const result = await orchestrator.executeAgent('scout', {
  thesis: { /* investment criteria */ },
  companyData: { /* company info */ }
});

console.log(result.output);
```

### Sourcing Workflow

Complete end-to-end target evaluation:

```javascript
const result = await orchestrator.executeSourcingWorkflow(
  thesis,      // Investment criteria
  companyData  // Company to evaluate
);

if (result.qualified) {
  console.log(`Score: ${result.summary.score}/100`);
  console.log(`Est. Value: $${result.summary.estimatedValue.midpoint}`);
  console.log('Top Signals:', result.summary.topSignals);
}
```

### Outreach Workflow

Generate compliant, personalized outreach:

```javascript
const result = await orchestrator.executeOutreachWorkflow(
  companyData,  // Company and contact info
  context       // Previous analysis results
);

if (result.success) {
  console.log('Subject:', result.outreachDraft.output.subject);
  console.log('Message:', result.outreachDraft.output.message_body);
}
```

### Custom Workflows

Build your own agent pipelines:

```javascript
// Sequential execution
const result = await orchestrator.executePipeline(
  ['scout', 'profiler', 'valuation'],
  initialInput
);

// Parallel execution
const result = await orchestrator.executeParallel(
  ['profiler', 'compliance'],
  companyData
);
```

## Agent Configurations

Each agent is configured with:

- **System Prompt** - Defines role, responsibilities, and output format
- **Temperature** - Controls creativity (0.1-0.7 depending on agent)
- **Max Tokens** - Output length limit
- **Role** - Functional category for workflow organization

See `src/config/agents.js` for detailed agent prompts and parameters.

## Workflows

### Sourcing Workflow
1. **Scout** - Score company against thesis
2. **Profiler** - Build detailed profile
3. **Valuation** - Estimate value (parallel with Compliance)
4. **Compliance** - Check licensure and regulatory status

### Outreach Workflow
1. **Compliance** - Validate outreach permissions
2. **Outreach** - Generate personalized message
3. *(Integration with email platform - coming soon)*

### Diligence Workflow
1. **Diligence** - Generate request list
2. **Diligence** - Analyze uploaded documents
3. **Diligence** - Produce IC memo

### Integration Workflow
1. **Integrator** - Create 100-day plan
2. **Integrator** - Set up KPI tracking
3. **Integrator** - Monitor progress

## Development

### Adding New Agents

1. Add agent config to `src/config/agents.js`
2. Agent will be automatically instantiated in `src/agents/index.js`
3. Create custom workflow in `src/workflows/orchestrator.js`

### Running Tests

```bash
npm test  # Coming soon
```

### Development Mode

Set `NODE_ENV=development` in `.env` to see detailed agent execution logs.

## Roadmap

### MVP (Current)
- ✅ Core agent system
- ✅ Basic orchestration
- ✅ Sourcing workflow
- ✅ Outreach workflow
- 🚧 Data ingestion connectors
- 🚧 Web interface

### v1 (Next)
- Entity resolution at scale
- Database integration (PostgreSQL)
- CRM sync (HubSpot)
- Email sending (SendGrid)
- HVAC vertical pack

### v2 (Future)
- Additional verticals (plumbing, landscaping, dental, MSP)
- Advanced valuation models
- Document Q&A with RAG
- Full integration playbooks

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Architecture and development guidelines
- **[Rollizer PRD.txt](./Rollizer%20PRD.txt)** - Complete product requirements
- **[hvac-consolidation-analysis.md](./hvac-consolidation-analysis.md)** - Market analysis

## Tech Stack

- **AI/LLM**: Anthropic Claude (via SDK)
- **Runtime**: Node.js
- **Future**: PostgreSQL, Redis, Elasticsearch, Next.js

## Contributing

This is an early-stage project. Contributions welcome!

## License

ISC

## Support

For questions or issues, see documentation or create an issue in the repository.

---

**Built with ❤️ and Claude AI**
