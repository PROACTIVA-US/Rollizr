# Rollizr Agent Assignments

This document maps each agent to its specific responsibilities in building and operating the Rollizr platform.

## 🎯 Agent Roster & Responsibilities

### 1. 🔍 Scout Agent
**Role**: `target_discovery`
**Temperature**: 0.3 (focused, analytical)

**Responsibilities**:
- Analyze companies against investment thesis criteria
- Calculate match scores (0-100) with transparent rationale
- Identify top signals that make companies attractive
- Flag risks and red flags
- Provide citations for all data points with confidence levels

**Output Format**:
```json
{
  "company_id": "string",
  "score": 0-100,
  "top_signals": ["signal1", "signal2"],
  "risks": ["risk1", "risk2"],
  "citations": [{"source": "...", "confidence": 0-1, "fact": "..."}],
  "rationale": "natural language explanation"
}
```

**Use Cases**:
- Initial target screening from data ingestion
- Re-scoring companies when thesis changes
- Bulk scoring of 1000s of companies
- Prioritizing outreach pipeline

---

### 2. 🔗 Resolver Agent
**Role**: `entity_resolution`
**Temperature**: 0.2 (very precise)

**Responsibilities**:
- Identify duplicate company records across data sources
- Perform fuzzy matching on names, addresses, phones, domains
- Assign confidence scores to entity matches
- Flag ambiguous cases for human review
- Maintain data lineage and provenance

**Matching Logic**:
- Domain match: HIGH confidence (auto-merge)
- Phone + ZIP: MEDIUM-HIGH confidence
- Name similarity + city: MEDIUM confidence
- Weak signals: LOW confidence (flag for review)

**Output Format**:
```json
{
  "primary_entity_id": "string",
  "merged_entities": ["id1", "id2"],
  "confidence": 0-1,
  "matching_fields": ["domain", "phone"],
  "conflicts": [{"field": "revenue", "values": [5000000, 5500000]}],
  "needs_review": boolean
}
```

**Use Cases**:
- Deduplicating scraped data from multiple sources
- Consolidating Google Maps, Yelp, state license data
- Merging company records during data ingestion
- Maintaining clean database

---

### 3. 📊 Profiler Agent
**Role**: `company_enrichment`
**Temperature**: 0.4 (balanced creativity)

**Responsibilities**:
- Build rich company profiles from web data
- Identify technology stack (website, CRM, field service software)
- Extract service offerings and pricing indicators
- Estimate operational maturity (1-10 scale)
- Analyze customer sentiment from reviews
- Map service areas and coverage

**Data Sources**:
- Company websites
- Google Maps/Reviews
- Yelp, BBB, Angi
- Social media (LinkedIn, Facebook)
- Job postings
- Website technology detection

**Output Format**:
```json
{
  "company_id": "string",
  "tech_stack": {"scheduling": "ServiceTitan", "website": "WordPress"},
  "services": ["AC Repair", "Installation", "Maintenance"],
  "pricing_indicators": {"has_financing": true, "service_plans": true},
  "operational_maturity": 7,
  "service_areas": ["Miami", "Fort Lauderdale"],
  "customer_sentiment": {"avg_rating": 4.7, "review_velocity": "high"},
  "confidence": 0.85
}
```

**Use Cases**:
- Enriching company records post-sourcing
- Understanding operational sophistication
- Preparing for valuation
- Informing outreach personalization

---

### 4. 💰 Valuation Agent
**Role**: `business_valuation`
**Temperature**: 0.3 (analytical)

**Responsibilities**:
- Estimate company value using multiple methodologies
- Apply industry-specific multiples (e.g., SDE 3.5-5.5× for HVAC)
- Find and apply comparable transactions
- Calculate DCF when data permits
- Provide value ranges (low, mid, high)
- State all assumptions clearly
- Perform sensitivity analysis

**Valuation Methods**:
1. **SDE Multiple** (primary for SMB)
2. **Comparable Transactions**
3. **DCF** (when sufficient data)
4. **Asset-based** (floor value)

**Output Format**:
```json
{
  "company_id": "string",
  "estimated_value_range": {"low": 18500000, "high": 27500000, "midpoint": 22000000},
  "methodologies": {
    "sde_multiple": {"value": 22000000, "multiple": 4.0, "sde_estimate": 5500000},
    "comps": {"value": 21000000, "comparable_deals": [...]},
    "dcf": {"npv": 23000000, "assumptions": {...}}
  },
  "key_assumptions": ["70% residential mix", "15% EBITDA margin"],
  "sensitivities": [{"variable": "growth_rate", "impact": "+/- 20%"}]
}
```

**Use Cases**:
- Initial valuation for sourcing workflow
- IC memo preparation
- Offer price determination
- Portfolio company revaluation

---

### 5. ⚖️ Compliance Agent
**Role**: `regulatory_compliance`
**Temperature**: 0.1 (extremely conservative)

**Responsibilities**:
- Validate outreach against TCPA, CAN-SPAM, state laws
- Check consent status before contact attempts
- Cross-reference Do Not Call (DNC) registry
- Verify business licensure and good standing
- Flag privacy violations
- Enforce quiet hours (no calls 9pm-8am local)
- Monitor communication frequency limits

**Compliance Checks**:
1. **Outreach validation** (consent, DNC, timing)
2. **Data usage** (permitted sources, retention)
3. **Licensure verification** (active, no disciplinary actions)

**Output Format**:
```json
{
  "entity_id": "string",
  "check_type": "outreach|data_access|licensure",
  "approved": boolean,
  "violations": [{"rule": "TCPA", "severity": "high", "details": "..."}],
  "required_actions": ["Obtain consent before SMS"],
  "timestamp": "2025-10-06T10:30:00Z"
}
```

**Use Cases**:
- Pre-send validation for all outreach
- Data access auditing
- Licensure verification during sourcing
- Regulatory compliance reporting

**Critical**: This agent has veto power. Always consult before outreach.

---

### 6. 📧 Outreach Agent
**Role**: `communication`
**Temperature**: 0.6 (creative but grounded)

**Responsibilities**:
- Draft personalized emails, voicemail scripts, SMS
- Reference specific facts about target company (NOT generic)
- Maintain respectful, professional, owner-friendly tone
- Include opt-out mechanisms
- Respect quiet hours and time zones
- Track consent and responses
- Adapt messaging based on engagement

**Outreach Principles**:
- Owner-centric (focus on their business, not your agenda)
- Specific (cite concrete facts: review counts, years in business)
- Concise (< 150 words for emails)
- Clear CTA (one simple next step)
- Transparent (honest about acquisition intent)
- Compliant (always include opt-out)

**Output Format**:
```json
{
  "company_id": "string",
  "channel": "email|sms|voicemail|linkedin",
  "subject": "Question about Cool Breeze HVAC's emergency service",
  "message_body": "Hi John,\n\nI've been researching Miami HVAC...",
  "personalization_tokens": {"owner_first": "John", "company": "Cool Breeze"},
  "send_time": "2025-10-07T10:00:00-04:00",
  "sequence_step": 1,
  "compliance_checked": true
}
```

**Use Cases**:
- Initial outreach to qualified targets
- Follow-up sequences (step 2, 3, 4)
- Re-engagement campaigns
- Post-meeting thank you notes

---

### 7. 📋 Diligence Agent
**Role**: `due_diligence`
**Temperature**: 0.3 (analytical)

**Responsibilities**:
- Generate comprehensive due diligence checklists by vertical
- Analyze uploaded documents (P&L, tax returns, contracts)
- Identify gaps in documentation
- Flag risks and red flags
- Summarize financial and operational metrics
- Draft IC (Investment Committee) memos

**Diligence Categories**:
1. **Financial** (P&L, balance sheet, tax returns, A/R aging)
2. **Operational** (customer list, service agreements, pricing)
3. **Legal** (licenses, insurance, liens, litigation)
4. **HR** (org chart, compensation, key person risk)
5. **Assets** (equipment, fleet, real estate, software)
6. **Commercial** (customers, contracts, churn, backlog)

**HVAC-Specific**:
- Technician certifications and retention
- Warranty liabilities
- Service territory and competition
- Seasonality analysis
- Recurring revenue (maintenance contracts)

**Output Format**:
```json
{
  "company_id": "string",
  "checklist": [{"category": "Financial", "item": "3-year P&L", "status": "received"}],
  "document_summaries": [{"doc_type": "P&L", "key_findings": [...], "red_flags": [...]}],
  "risk_assessment": {"level": "medium", "factors": [...]},
  "gaps": ["Missing: Insurance certificates"],
  "ic_memo_sections": {
    "investment_thesis": "...",
    "financial_summary": "...",
    "key_risks": "...",
    "recommendation": "Proceed to LOI"
  }
}
```

**Use Cases**:
- Generating initial diligence request list
- Analyzing uploaded documents
- Preparing IC memos
- Tracking diligence progress
- Identifying deal-breakers

---

### 8. 🔄 Integrator Agent
**Role**: `post_acquisition`
**Temperature**: 0.4 (balanced)

**Responsibilities**:
- Create 100-day integration plans
- Define KPIs and tracking mechanisms
- Build system integration checklists
- Monitor progress against plan
- Identify quick wins and synergies
- Flag integration risks early

**Integration Workstreams**:
1. **Day 1**: Communications, legal close, system access
2. **Week 1**: Key personnel meetings, IT audit, customer plan
3. **Month 1**: Process mapping, quick wins, financial integration
4. **Month 2**: System integrations, cross-selling, efficiency
5. **Month 3**: Full integration, KPI dashboards, synergy capture

**KPIs to Track**:
- Revenue retention (customer churn)
- Employee retention (especially technicians)
- Revenue per technician per day
- Average ticket size
- Gross margin
- Customer satisfaction (NPS)
- Service response time
- First-time fix rate

**System Integrations**:
- Accounting (QuickBooks → consolidated GL)
- Field service (ServiceTitan → unified scheduling)
- CRM (contact consolidation)
- Payroll (Gusto/ADP integration)
- Phone (call routing)

**Output Format**:
```json
{
  "company_id": "string",
  "integration_plan": {
    "day_1": [{"task": "Employee announcement", "owner": "CEO", "status": "pending"}],
    "week_1": [...],
    "month_1": [...],
    "month_2": [...],
    "month_3": [...]
  },
  "kpis": [{"metric": "Revenue retention", "target": 95, "current": 97, "trend": "up"}],
  "system_integrations": [{"system": "QuickBooks", "status": "in_progress", "priority": "high"}],
  "quick_wins": [{"opportunity": "Bulk supply purchasing", "value_estimate": 50000, "effort": "low"}],
  "risks": [{"risk": "Key tech departure", "mitigation": "Retention bonus", "owner": "HR"}]
}
```

**Use Cases**:
- Post-close integration planning
- 100-day progress tracking
- KPI monitoring
- Synergy identification
- Risk mitigation

---

## 🔄 Agent Workflows

### Sourcing Workflow
```
Scout → Profiler → Valuation + Compliance
```

1. **Scout** screens company against thesis → score
2. If score ≥ 50, **Profiler** enriches data
3. **Valuation** + **Compliance** run in parallel
4. If compliant and value in range → qualified for outreach

### Outreach Workflow
```
Compliance → Outreach
```

1. **Compliance** validates contact permissions
2. If approved, **Outreach** generates message
3. (Future: Send via SendGrid/HubSpot)

### Diligence Workflow
```
Diligence (request list) → Diligence (analysis) → Diligence (IC memo)
```

1. **Diligence** generates checklist
2. Owner uploads documents
3. **Diligence** analyzes and summarizes
4. **Diligence** produces IC memo

### Integration Workflow
```
Integrator (plan) → Integrator (track) → Integrator (monitor)
```

1. **Integrator** creates 100-day plan
2. **Integrator** sets up KPI tracking
3. **Integrator** monitors progress weekly

---

## 🎛 Agent Orchestration

All agents are coordinated by the **AgentOrchestrator** class:

### Single Agent
```javascript
orchestrator.executeAgent('scout', data)
```

### Pipeline (Sequential)
```javascript
orchestrator.executePipeline(['scout', 'profiler', 'valuation'], data)
```

### Parallel
```javascript
orchestrator.executeParallel(['valuation', 'compliance'], data)
```

### Pre-Built Workflows
```javascript
orchestrator.executeSourcingWorkflow(thesis, company)
orchestrator.executeOutreachWorkflow(company, context)
orchestrator.executeDiligenceWorkflow(company, documents)
orchestrator.executeIntegrationWorkflow(deal)
```

---

## 📊 Agent Statistics

Track agent performance:

```javascript
const stats = orchestrator.getStats();
// {
//   totalExecutions: 42,
//   byAgent: { scout: { count: 10, successes: 10 }, ... },
//   successRate: 100,
//   avgExecutionTime: 2847
// }
```

---

## 🎯 Building the Product

### Phase 1: MVP (Current)
**Agents Needed**: Scout, Profiler, Valuation, Compliance, Outreach

**Tasks**:
- ✅ Agent system implemented
- 🚧 Data ingestion (web scraping, APIs)
- 🚧 Database (PostgreSQL)
- 🚧 Web UI (Next.js)
- 🚧 CRM integration (HubSpot)

### Phase 2: v1
**Agents Needed**: All 8 agents

**Tasks**:
- Resolver at scale (100k+ entities)
- Diligence workflow with document upload
- Integration tracking dashboard
- Email sending (SendGrid)
- SMS/voice (Twilio)

### Phase 3: v2
**Agents Needed**: All + new vertical-specific agents

**Tasks**:
- Additional verticals (plumbing, landscaping, dental)
- Advanced valuation models
- Document Q&A with RAG
- Automated LOI generation

---

## 🔐 Agent Security & Compliance

Each agent operates under strict guardrails:

1. **Data Access**: Only permitted sources
2. **Audit Logging**: All actions logged with timestamps
3. **Rate Limiting**: Respect API quotas
4. **PII Handling**: Minimize and encrypt
5. **Compliance First**: Compliance agent has veto power

---

## 🚀 Ready to Build!

Your agent team is assembled and ready to execute. Each agent has clear responsibilities, defined outputs, and specific use cases.

Next steps:
1. Run the demos: `npm run demo:sourcing`
2. Customize agent prompts in `src/config/agents.js`
3. Build data ingestion for your target vertical
4. Create your frontend
5. Deploy and scale!

**All agents are standing by for deployment.** 🎯
