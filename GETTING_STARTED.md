# Getting Started with Rollizr

Complete guide to getting your Rollizr M&A platform up and running.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL** installed (for database features)
- **Anthropic API key** ([get one here](https://console.anthropic.com/))
- **Google Maps API key** (optional, for scraping)
- **Yelp API key** (optional, for scraping)

## Step 1: Environment Setup

### 1.1 Configure API Keys

Edit your `.env` file and add your API keys:

```bash
# Required for AI agents
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Optional for data scraping
GOOGLE_MAPS_API_KEY=your-google-key-here
YELP_API_KEY=your-yelp-key-here

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://localhost:5432/rollizr
```

### 1.2 Install Dependencies

```bash
npm install
```

## Step 2: Database Setup (Optional)

If you want to persist data, set up PostgreSQL:

### 2.1 Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2.2 Create Database

```bash
# Create the database
createdb rollizr

# Or using psql
psql -U postgres
CREATE DATABASE rollizr;
\q
```

### 2.3 Initialize Schema

```bash
npm run db:init
```

This creates all necessary tables, indexes, and views.

## Step 3: Test the System

### 3.1 Verify Installation

```bash
npm start
```

You should see the Rollizr banner with all 8 agents listed.

### 3.2 Run Agent Demos

Test individual workflows:

```bash
# Test sourcing workflow (Scout → Profiler → Valuation)
npm run demo:sourcing

# Test outreach workflow (Compliance → Outreach)
npm run demo:outreach
```

These run with mock data and don't require API keys initially.

## Step 4: Scrape Real Data

### 4.1 Get API Keys

**Google Maps API:**
1. Go to https://console.cloud.google.com/
2. Create a project
3. Enable Places API
4. Create API key
5. Add to `.env` as `GOOGLE_MAPS_API_KEY`

**Yelp API:**
1. Go to https://www.yelp.com/developers
2. Create an app
3. Get API key
4. Add to `.env` as `YELP_API_KEY`

### 4.2 Run Ingestion Pipeline

```bash
npm run demo:ingestion
```

This will:
1. Scrape HVAC companies from Google Maps
2. Scrape HVAC companies from Yelp
3. Resolve duplicate entities
4. Store in database (if configured)
5. Score companies using Scout agent

**Example output:**
```
🚀 Starting ingestion pipeline for Miami, FL
═══════════════════════════════════════════════════════════

📍 Step 1: Scraping Google Maps...
   Found 18 companies from Google Maps

⭐ Step 2: Scraping Yelp...
   Found 22 companies from Yelp

🔗 Step 3: Entity Resolution...
   Resolved to 25 unique companies

💾 Step 4: Storing in database...
   Saved 25 companies to database

📊 Step 5: Scoring companies...
   Scored 25 companies

✅ Ingestion pipeline completed successfully!
```

## Step 5: Query Your Data

### 5.1 Using Node.js

```javascript
const Company = require('./src/db/models/company');

// Get all companies
const companies = await Company.findByVertical('HVAC');

// Get companies with scores >= 50
const qualified = await Company.getWithScores(50);

// Search by name
const results = await Company.searchByName('Cool Breeze');
```

### 5.2 Using SQL

```bash
psql rollizr
```

```sql
-- Get qualified companies
SELECT * FROM qualified_companies;

-- Top scored companies
SELECT c.legal_name, c.city, c.state, s.total as score
FROM companies c
JOIN scores s ON c.id = s.company_id
ORDER BY s.total DESC
LIMIT 10;

-- Deal pipeline
SELECT * FROM deal_pipeline;
```

## Step 6: Run Full Workflows

### 6.1 Sourcing Workflow

```javascript
const { AgentOrchestrator } = require('./src');
const orchestrator = new AgentOrchestrator();

// Define your thesis
const thesis = {
  vertical: 'HVAC',
  geography: { states: ['FL'] },
  financials: {
    revenue_min: 2000000,
    revenue_max: 10000000
  },
  operations: {
    min_reviews: 200,
    require_24_7: true
  }
};

// Get a company from database
const Company = require('./src/db/models/company');
const companies = await Company.findByVertical('HVAC');

// Score it
const result = await orchestrator.executeSourcingWorkflow(
  thesis,
  companies[0]
);

if (result.qualified) {
  console.log(`Score: ${result.summary.score}/100`);
  console.log(`Value: $${result.summary.estimatedValue.midpoint}`);
}
```

### 6.2 Outreach Workflow

```javascript
// For qualified companies, generate outreach
const outreach = await orchestrator.executeOutreachWorkflow(
  companies[0],
  { scoutAnalysis: result.summary }
);

console.log('Subject:', outreach.outreachDraft.output.subject);
console.log('Message:', outreach.outreachDraft.output.message_body);
```

## Common Tasks

### Scrape Multiple Locations

```javascript
const IngestionPipeline = require('./src/ingestion/pipeline');
const pipeline = new IngestionPipeline();

const locations = ['Miami, FL', 'Tampa, FL', 'Orlando, FL'];

const results = await pipeline.ingestMultipleLocations(locations, {
  includeGoogleMaps: true,
  includeYelp: true,
  runScoring: true,
  thesis: myThesis
});
```

### Export Qualified Companies

```javascript
const qualified = await Company.getWithScores(70); // Score >= 70

// Export to CSV
const csv = qualified.map(c =>
  `${c.legal_name},${c.city},${c.state},${c.score},${c.phone},${c.website}`
).join('\n');

fs.writeFileSync('qualified_companies.csv', csv);
```

### Generate IC Memo

```javascript
// Run diligence workflow
const diligence = await orchestrator.executeAgent('diligence', {
  company_id: company.id,
  documents: [],
  vertical: 'HVAC'
});

const icMemo = diligence.output.ic_memo_sections;
console.log(icMemo.investment_thesis);
console.log(icMemo.key_risks);
console.log(icMemo.recommendation);
```

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
Make sure `.env` file exists and contains your API key.

### "Database connection failed"
1. Check PostgreSQL is running: `brew services list` (macOS)
2. Verify DATABASE_URL in `.env`
3. Try: `psql -U postgres` to test connection

### "Permission denied" errors
```bash
chmod +x examples/*.js
chmod +x scripts/*.js
```

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Rate Limiting from APIs
- Google Maps: 1 request/second recommended
- Yelp: 500 requests/day on free tier
- Increase delays in scrapers if hitting limits

## Next Steps

1. **Customize Agents** - Edit prompts in `src/config/agents.js`
2. **Add More Verticals** - Duplicate HVAC thesis for plumbing, electrical, etc.
3. **Build UI** - Create Next.js frontend
4. **Integrate CRM** - Connect to HubSpot or Salesforce
5. **Deploy** - Deploy to GCP Cloud Run or AWS

## Getting Help

- **Documentation**: See README.md, CLAUDE.md, AGENT_ASSIGNMENTS.md
- **PRD**: See Rollizer PRD.txt for complete product vision
- **Issues**: Create an issue on GitHub

## Cost Estimates

### API Costs (approximate)

**Anthropic Claude:**
- Sourcing workflow: $0.10-0.30 per company
- Outreach generation: $0.05-0.10 per message
- Daily usage for 100 companies: ~$15-30

**Google Maps:**
- Places API: $17 per 1000 requests
- 100 companies: ~$1.70

**Yelp:**
- Free tier: 500 requests/day
- Paid: Contact Yelp

### Total Cost Example
Scraping and scoring 1000 companies:
- Google Maps: ~$20
- Claude API: ~$150-300
- Yelp: Free (or ~$50 paid)
- **Total: ~$170-370**

## Development Workflow

```bash
# 1. Pull latest code
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes
# ... edit files ...

# 4. Test
npm run demo:sourcing

# 5. Commit
git add .
git commit -m "Add my feature"

# 6. Push
git push origin feature/my-feature

# 7. Create PR on GitHub
```

---

**You're all set! Start building your M&A platform.** 🚀
