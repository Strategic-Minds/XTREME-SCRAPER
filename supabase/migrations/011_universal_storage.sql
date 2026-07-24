-- XTREME SCRAPER Universal Storage Migration
-- Run in Supabase SQL Editor

-- Universal leads table (any industry, any city, globally)
CREATE TABLE IF NOT EXISTS universal_leads (
  id              BIGSERIAL PRIMARY KEY,
  company_name    TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT DEFAULT 'US',
  rating          DECIMAL(3,1),
  review_count    INTEGER DEFAULT 0,
  category        TEXT,
  source          TEXT,
  confidence      INTEGER DEFAULT 50,
  search_query    TEXT,
  run_id          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_universal_leads_query ON universal_leads(search_query);
CREATE INDEX IF NOT EXISTS idx_universal_leads_city  ON universal_leads(city, state);
CREATE INDEX IF NOT EXISTS idx_universal_leads_cat   ON universal_leads(category);

-- Enrichment cache (7-day TTL)
CREATE TABLE IF NOT EXISTS enrichment_cache (
  cache_key       TEXT PRIMARY KEY,
  company_name    TEXT NOT NULL,
  city            TEXT,
  state           TEXT,
  data            JSONB NOT NULL,
  enriched_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enrich_cache_at ON enrichment_cache(enriched_at);

-- Person searches
CREATE TABLE IF NOT EXISTS person_searches (
  id          BIGSERIAL PRIMARY KEY,
  full_name   TEXT NOT NULL,
  company     TEXT,
  city        TEXT,
  state       TEXT,
  result      JSONB NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_person_name ON person_searches(full_name);

-- Search runs (all searches ever made)
CREATE TABLE IF NOT EXISTS search_runs (
  id              BIGSERIAL PRIMARY KEY,
  query           TEXT NOT NULL,
  city            TEXT,
  state           TEXT,
  mode            TEXT,
  intelligence_mode TEXT,
  results_count   INTEGER DEFAULT 0,
  sources_used    JSONB DEFAULT '[]',
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_runs_query ON search_runs(query);
CREATE INDEX IF NOT EXISTS idx_search_runs_ts    ON search_runs(created_at DESC);
