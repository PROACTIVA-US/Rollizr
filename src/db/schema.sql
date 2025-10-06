-- Rollizr Database Schema
-- PostgreSQL schema for M&A platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- =============================================
-- CORE ENTITIES
-- =============================================

-- Companies table (main entity)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifiers
    legal_name VARCHAR(255) NOT NULL,
    dba VARCHAR(255),
    domain VARCHAR(255),

    -- Contact
    phone VARCHAR(50),
    website VARCHAR(500),
    email VARCHAR(255),

    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Business info
    naics VARCHAR(10),
    vertical VARCHAR(50) NOT NULL,
    business_status VARCHAR(50) DEFAULT 'OPERATIONAL',

    -- Estimates
    estimated_revenue BIGINT,
    estimated_employees INTEGER,
    years_in_business INTEGER,

    -- External IDs
    google_place_id VARCHAR(255),
    yelp_id VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_quality_score DECIMAL(3, 2), -- 0-1 score

    -- Constraints
    UNIQUE(domain),
    UNIQUE(google_place_id),
    UNIQUE(yelp_id)
);

-- Create indexes
CREATE INDEX idx_companies_vertical ON companies(vertical);
CREATE INDEX idx_companies_state ON companies(state);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(legal_name gin_trgm_ops);

-- =============================================
-- SCORING & ANALYSIS
-- =============================================

-- Investment theses
CREATE TABLE theses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vertical VARCHAR(50) NOT NULL,
    criteria JSONB NOT NULL, -- Investment criteria
    weights JSONB, -- Scoring weights
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company scores
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    thesis_id UUID REFERENCES theses(id) ON DELETE CASCADE,

    total INTEGER NOT NULL CHECK (total >= 0 AND total <= 100),
    weights JSONB, -- Individual dimension scores
    rationale TEXT,
    top_signals TEXT[],

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(company_id, thesis_id)
);

CREATE INDEX idx_scores_company ON scores(company_id);
CREATE INDEX idx_scores_thesis ON scores(thesis_id);
CREATE INDEX idx_scores_total ON scores(total DESC);

-- Risk flags
CREATE TABLE risk_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    type VARCHAR(100) NOT NULL, -- licensure, financial, legal, operational
    severity VARCHAR(20) NOT NULL, -- high, medium, low
    details TEXT NOT NULL,
    source_id UUID, -- Reference to source data

    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_flags_company ON risk_flags(company_id);
CREATE INDEX idx_risk_flags_severity ON risk_flags(severity);

-- =============================================
-- CONTACTS & OUTREACH
-- =============================================

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    owner_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    title VARCHAR(100),

    -- Consent tracking
    consent_status VARCHAR(50) DEFAULT 'none', -- none, email_ok, sms_ok, call_ok, all
    consent_date TIMESTAMP,
    dnc_status VARCHAR(50) DEFAULT 'not_checked', -- not_checked, not_on_list, on_list

    -- Engagement
    last_contacted_at TIMESTAMP,
    last_response_at TIMESTAMP,
    engagement_level VARCHAR(20), -- cold, warm, hot

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Contact attempts / Communications log
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

    channel VARCHAR(50) NOT NULL, -- email, sms, call, voicemail, linkedin
    direction VARCHAR(20) NOT NULL, -- outbound, inbound

    subject VARCHAR(500),
    message_body TEXT,

    status VARCHAR(50), -- sent, delivered, opened, clicked, replied, bounced

    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    replied_at TIMESTAMP,

    sequence_step INTEGER,
    compliance_checked BOOLEAN DEFAULT false,

    metadata JSONB, -- tracking IDs, etc.

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communications_company ON communications(company_id);
CREATE INDEX idx_communications_contact ON communications(contact_id);
CREATE INDEX idx_communications_channel ON communications(channel);
CREATE INDEX idx_communications_sent_at ON communications(sent_at);

-- =============================================
-- DEALS & PIPELINE
-- =============================================

-- Deals
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    stage VARCHAR(50) NOT NULL, -- uncontacted, engaged, diligence, loi, close, integrating
    owner VARCHAR(255), -- Deal owner (user)

    -- Valuation
    estimated_value_low BIGINT,
    estimated_value_mid BIGINT,
    estimated_value_high BIGINT,

    -- Documents
    ic_memo_url VARCHAR(500),
    loi_url VARCHAR(500),

    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),

    -- Timeline
    first_contact_at TIMESTAMP,
    loi_sent_at TIMESTAMP,
    closed_at TIMESTAMP,

    next_action TEXT,
    next_action_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_owner ON deals(owner);

-- =============================================
-- DATA SOURCES & LINEAGE
-- =============================================

-- Data sources (for provenance tracking)
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    source_type VARCHAR(50) NOT NULL, -- google_maps, yelp, state_license, web_scrape
    source_url VARCHAR(500),

    data JSONB NOT NULL, -- Raw data

    confidence DECIMAL(3, 2), -- 0-1

    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_sources_company ON data_sources(company_id);
CREATE INDEX idx_data_sources_type ON data_sources(source_type);

-- =============================================
-- REVIEWS & REPUTATION
-- =============================================

-- Reviews (aggregated from various sources)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    source VARCHAR(50) NOT NULL, -- google, yelp, bbb, angi
    external_review_id VARCHAR(255),

    rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
    review_text TEXT,
    reviewer_name VARCHAR(255),

    review_date TIMESTAMP,

    sentiment VARCHAR(20), -- positive, neutral, negative

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(source, external_review_id)
);

CREATE INDEX idx_reviews_company ON reviews(company_id);
CREATE INDEX idx_reviews_source ON reviews(source);
CREATE INDEX idx_reviews_date ON reviews(review_date DESC);

-- =============================================
-- LICENSES & COMPLIANCE
-- =============================================

-- Business licenses
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    state VARCHAR(2),

    status VARCHAR(50) NOT NULL, -- active, expired, suspended, revoked

    issue_date DATE,
    expiration_date DATE,

    verified_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_licenses_company ON licenses(company_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expiration ON licenses(expiration_date);

-- =============================================
-- INTEGRATION & POST-CLOSE
-- =============================================

-- Integration tasks (100-day plan)
CREATE TABLE integration_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

    phase VARCHAR(50) NOT NULL, -- day_1, week_1, month_1, month_2, month_3
    task TEXT NOT NULL,

    owner VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, complete, blocked

    due_date DATE,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integration_tasks_deal ON integration_tasks(deal_id);
CREATE INDEX idx_integration_tasks_status ON integration_tasks(status);

-- KPI tracking
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 2),
    target_value DECIMAL(15, 2),

    period_start DATE,
    period_end DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpis_company ON kpis(company_id);
CREATE INDEX idx_kpis_deal ON kpis(deal_id);
CREATE INDEX idx_kpis_period ON kpis(period_start, period_end);

-- =============================================
-- AUDIT LOG
-- =============================================

-- Audit log for compliance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    entity_type VARCHAR(50) NOT NULL, -- company, deal, communication, etc.
    entity_id UUID NOT NULL,

    action VARCHAR(100) NOT NULL, -- created, updated, deleted, accessed

    user_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,

    changes JSONB, -- Before/after values

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theses_updated_at BEFORE UPDATE ON theses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_tasks_updated_at BEFORE UPDATE ON integration_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Qualified companies view (scored >= 50, compliant)
CREATE VIEW qualified_companies AS
SELECT
    c.*,
    s.total as score,
    s.top_signals,
    s.rationale,
    d.stage as deal_stage,
    COUNT(rf.id) FILTER (WHERE rf.severity = 'high') as high_risk_count
FROM companies c
LEFT JOIN scores s ON c.id = s.company_id
LEFT JOIN deals d ON c.id = d.company_id
LEFT JOIN risk_flags rf ON c.id = rf.company_id AND rf.resolved = false
WHERE s.total >= 50
GROUP BY c.id, s.total, s.top_signals, s.rationale, d.stage
HAVING COUNT(rf.id) FILTER (WHERE rf.severity = 'high') = 0;

-- Deal pipeline view
CREATE VIEW deal_pipeline AS
SELECT
    d.*,
    c.legal_name,
    c.city,
    c.state,
    c.vertical,
    s.total as score,
    COUNT(comm.id) as communication_count,
    MAX(comm.sent_at) as last_contact
FROM deals d
JOIN companies c ON d.company_id = c.id
LEFT JOIN scores s ON c.id = s.company_id
LEFT JOIN communications comm ON c.id = comm.company_id
GROUP BY d.id, c.legal_name, c.city, c.state, c.vertical, s.total;
