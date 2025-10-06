# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rollizr** (working name: FIRP - Fragmented Industry Rollup Platform) is an AI-native platform for sourcing, scoring, and executing M&A deals across fragmented service industries, starting with HVAC.

**Core Value Proposition**: Transform weeks of manual research into minutes by orchestrating agentic workflows that identify acquisition targets, automate compliant outreach, assist with due diligence, and track post-close value creation.

## Project Context

This is an early-stage project currently in the planning phase. The repository contains:
- `Rollizer PRD.txt`: Complete product requirements document defining the platform vision, architecture, and feature set
- `hvac-consolidation-analysis.md`: Market analysis and business opportunity assessment for HVAC vertical

**Key Design Principles** (from PRD):
- AI-first architecture with MCP-compatible agents
- Transparency and auditability for all AI decisions (explainable scoring with rationales)
- Compliance-by-design (TCPA, CAN-SPAM, privacy regulations)
- Owner-friendly outreach (respectful, consent-based communication)

## System Architecture

When implementing this platform, follow the high-level architecture from the PRD:

### Core Components
1. **Ingestion Layer**: Airbyte/custom connectors → Kafka/NATS → Object store + Lakehouse (Parquet/Delta)
2. **Processing**: Spark/Beam jobs for entity resolution; feature store for ML
3. **Model Serving**: Classification/scoring models + RAG over industry knowledge graph
4. **Agent Orchestrator**: MCP-compatible agents (Scout, Resolver, Profiler, Valuation, Compliance, Outreach, Diligence, Integrator)
5. **Workflow Engine**: Goose/Dagster/Dagger for idempotent steps and retries
6. **APIs**: GraphQL for queries, REST for webhooks, event bus for automations
7. **Frontend**: Next.js with role-aware views, real-time updates, optimistic UI

### Agent Architecture
All agents should follow MCP (Model Context Protocol) standards. The core agent roster includes:
- **Scout Agent**: Finds candidates by thesis, explains rationale, attaches sources
- **Resolver Agent**: Entity resolution with confidence labels
- **Profiler Agent**: Builds rich company profiles (tech stack, services, pricing)
- **Valuation Agent**: Triangulates value (comps, rules, DCF) with stated assumptions
- **Compliance Agent**: Monitors outreach and data rules, licensure checks
- **Outreach Agent**: Writes and schedules sequences, adapts tone, logs consent
- **Diligence Agent**: Generates request lists, summarizes uploads, gap analysis
- **Integrator Agent**: 100-day plan templating, KPI pulls, owner communications

Each agent should implement multi-agent critique loops and guardrail policies.

## Tech Stack (Planned)

### Frontend
- Next.js/React
- Tailwind CSS
- tRPC or GraphQL
- WebSockets for real-time updates

### Backend
- Python FastAPI (or Node/Nest)
- PostgreSQL (primary data store)
- Elasticsearch (search)
- Redis (queues, cache)
- Object store for documents

### Data Pipeline
- Airbyte for standard connectors
- Custom scrapers for specialized sources
- dbt for transformations
- Spark/Beam for large-scale processing
- NATS or Kafka for event streaming

### AI/ML
- MCP servers for agent orchestration
- Workflow orchestration: Goose, Dagster, or Dagger
- Model router: LiteLLM for cost optimization and fallbacks
- Vector DB for RAG (company knowledge cards)

### Infrastructure
- GCP (Cloud Run or GKE)
- Terraform for IaC
- GitHub Actions for CI/CD
- OpenTelemetry, Prometheus, Grafana for observability

## Data Model (Key Entities)

Core entities from PRD section 10:
- **company**: legal_name, dba, domain, phone, naics, vertical, revenue_estimate, employees_estimate, years_in_business, location
- **score**: company_id, thesis_id, total, weights_json, rationale, updated_at
- **risk_flag**: company_id, type, severity, details, source_id
- **contact**: company_id, owner_name, email, phone, consent_status, last_contacted_at
- **deal**: company_id, stage, owner, ic_memo_url, loi_url, confidence, next_action_at

**Critical**: Maintain data lineage and provenance for every field. All data must be traceable to source with confidence scores.

## Compliance Requirements

This platform handles sensitive data and automated outreach. Always implement:
- Consent management (double opt-in for SMS where required)
- DNC list respect and honor unsubscribe immediately
- Audit trail of all consents and communications
- Data minimization principles
- Regional privacy compliance (CCPA/CPRA, etc.)
- DSAR and erasure workflows
- Field-level RBAC controls

**Never skip compliance checks** - these should be guardrails in the agent workflows, not optional.

## Security Requirements

- SSO (OIDC/SAML) + MFA
- RBAC with field-level controls
- Encryption: TLS 1.2+, AES-256 at rest
- Secrets via Vault/KMS with rotation policies
- Scoped service accounts for connectors
- Tamper-evident audit logs

## HVAC Vertical Specifics

When implementing HVAC vertical features (first target market):
- **Key Signals**: Google review count/velocity, service hours (24/7), emergency fees, truck/crew count, permit volume, licensure class, seasonality, software footprint
- **Thesis Thresholds** (example): Revenue $3-12M, Residential ≥60%, Reviews ≥200, 24/7 availability, licenses in good standing
- **Valuation**: SDE multiples 3.5-5.5× for SMB, with growth adjustments and add-backs catalogue
- **Risk Flags**: Warranty liabilities, technician scarcity, vendor dependency, weather sensitivity

## Development Phases

### MVP (0-8 weeks)
- Core ingestion (web + Google Maps + Yelp + state licenses)
- Entity resolution with basic scoring
- Sourcing map/table, candidate drawer, export IC memo
- Email sequences via SendGrid
- HubSpot CRM sync
- Audit log skeleton

### v1 (8-16 weeks)
- Full agentic pipeline with retries
- HVAC vertical pack
- Post-close cockpit (manual CSV or QuickBooks lite)
- Compliance guardrails v1
- SMS + voice drop

### v1.5 (16-24 weeks)
- ServiceTitan/Housecall Pro integrations
- QuickBooks/Xero deep sync
- Risk engine with SHAP-style rationales
- What-if tuner and compare view

### v2 (24+ weeks)
- Additional vertical packs (plumbing, landscaping, dental, MSP)
- Advanced signals (permits, ads, social)
- FOIA agent
- Document Q&A search
- Valuation sandbox with sensitivity analysis

## Code Organization Principles

When setting up the codebase:
1. Separate concerns: data ingestion, processing, agent logic, API, frontend
2. Each agent should be independently testable and deployable
3. Use event-driven architecture for loose coupling
4. Implement circuit breakers and graceful degradation for external connectors
5. All AI outputs should include citations and confidence scores
6. Build observability from day one (OpenTelemetry traces, cost metering per agent)

## Key Success Metrics

Track these KPIs as the platform develops:
- **Sourcing**: candidates/week, % enriched to ≥80% completeness
- **Conversion**: reply rate, meeting rate, LOIs issued, wins/LOI
- **Cycle time**: first-touch → intro call, intro → IC, IC → LOI, LOI → close
- **Model accuracy**: precision@k of top-scored candidates leading to meetings
- **Post-close**: 100-day completion %, EBITDA delta vs. plan

## References

- Full PRD: `Rollizer PRD.txt`
- Market analysis: `hvac-consolidation-analysis.md`
