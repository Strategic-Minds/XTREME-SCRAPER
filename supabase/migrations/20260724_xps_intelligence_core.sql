-- XPS Intelligence preview schema proposal.
-- REVIEW IN AN ISOLATED SUPABASE DEVELOPMENT BRANCH BEFORE APPLYING.
-- No public policies are created. Server-side service role access remains the only allowed path.

create extension if not exists pgcrypto;

create table if not exists source_registry (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  display_name text not null,
  decision text not null check (decision in ('allow','quarantine','deny')),
  owner text,
  purpose text,
  allowed_paths jsonb not null default '[]'::jsonb,
  robots_posture text,
  terms_posture text,
  data_classes jsonb not null default '[]'::jsonb,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  search_request_id uuid,
  entity_key text not null,
  claim_type text not null,
  claim_value jsonb not null,
  source_key text not null,
  source_url text,
  retrieved_at timestamptz not null default now(),
  event_at timestamptz,
  confidence numeric(5,2) check (confidence between 0 and 100),
  verification_status text not null default 'unverified',
  expires_at timestamptz,
  correlation_id text,
  created_at timestamptz not null default now()
);
create index if not exists evidence_records_entity_idx on evidence_records(entity_key, retrieved_at desc);
create index if not exists evidence_records_search_idx on evidence_records(search_request_id);

create table if not exists opportunity_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  entity_key text not null,
  search_request_id uuid,
  score integer not null check (score between 0 and 100),
  confidence text not null check (confidence in ('low','medium','high')),
  model_version text not null,
  positive_factors jsonb not null default '[]'::jsonb,
  negative_factors jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists opportunity_scores_entity_idx on opportunity_scores(entity_key, created_at desc);

create table if not exists search_receipts (
  id uuid primary key default gen_random_uuid(),
  request_id text unique not null,
  organization_id uuid,
  query text not null,
  location jsonb not null default '{}'::jsonb,
  requested_mode text,
  executed_mode text,
  sources_used jsonb not null default '[]'::jsonb,
  sources_skipped jsonb not null default '[]'::jsonb,
  verified_count integer not null default 0,
  quarantined_count integer not null default 0,
  denied_count integer not null default 0,
  duration_ms integer,
  rate_limit_backend text,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table source_registry enable row level security;
alter table evidence_records enable row level security;
alter table opportunity_scores enable row level security;
alter table search_receipts enable row level security;

-- Intentionally no anon/authenticated policies. These tables are server-only until
-- tenant ownership is confirmed and regression-tested in a development branch.

insert into source_registry (source_key, display_name, decision, purpose, robots_posture, terms_posture)
values
  ('google_maps','Google Maps / Places','allow','Public business discovery','provider API','provider API terms'),
  ('bbb','Better Business Bureau','allow','Public business registry discovery','review required','review required'),
  ('yellowpages','Yellow Pages','allow','Public directory discovery','review required','review required'),
  ('apollo','Apollo','allow','Licensed B2B contact enrichment','provider API','provider API terms'),
  ('firecrawl','Firecrawl','allow','Approved public-page retrieval','policy inherited','provider terms'),
  ('browser_worker','BrowserWorker','allow','Approved browser retrieval','domain allowlist required','source terms required'),
  ('ai_intelligence','AI-only candidate generation','quarantine','Candidate discovery only','not applicable','must be corroborated')
on conflict (source_key) do update set display_name = excluded.display_name, decision = excluded.decision, purpose = excluded.purpose, updated_at = now();
