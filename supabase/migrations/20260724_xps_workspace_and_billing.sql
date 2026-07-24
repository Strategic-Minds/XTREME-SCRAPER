-- XPS Intelligence workspace and billing ledger proposal.
-- REVIEW AND TEST IN AN ISOLATED SUPABASE DEVELOPMENT BRANCH.
-- This file has not been applied to preview or production.

create extension if not exists pgcrypto;

create table if not exists xps_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists xps_organization_memberships (
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  user_id uuid not null references xps_users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','analyst','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create index if not exists xps_memberships_user_idx on xps_organization_memberships(user_id);

create table if not exists xps_saved_searches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  created_by uuid not null references xps_users(id),
  name text not null,
  intent text not null,
  query text not null,
  city text,
  state text,
  mode text not null default 'deep',
  intelligence_mode text not null default 'deep',
  filters jsonb not null default '{}'::jsonb,
  alert_enabled boolean not null default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists xps_saved_searches_org_idx on xps_saved_searches(organization_id,updated_at desc);

create table if not exists xps_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  created_by uuid not null references xps_users(id),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,name)
);

create table if not exists xps_list_entities (
  list_id uuid not null references xps_lists(id) on delete cascade,
  entity_key text not null,
  entity_type text not null check (entity_type in ('company','person','contact','opportunity')),
  added_by uuid not null references xps_users(id),
  notes text,
  created_at timestamptz not null default now(),
  primary key (list_id,entity_key,entity_type)
);

create table if not exists xps_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  saved_search_id uuid not null references xps_saved_searches(id) on delete cascade,
  created_by uuid not null references xps_users(id),
  status text not null default 'paused' check (status in ('active','paused','disabled')),
  cadence text not null default 'daily' check (cadence in ('hourly','daily','weekly')),
  signal_types jsonb not null default '[]'::jsonb,
  minimum_confidence numeric(5,2) not null default 70 check (minimum_confidence between 0 and 100),
  last_checked_at timestamptz,
  next_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists xps_alerts_due_idx on xps_alerts(status,next_check_at);

create table if not exists xps_alert_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  alert_id uuid not null references xps_alerts(id) on delete cascade,
  entity_key text not null,
  signal_type text not null,
  evidence_ids jsonb not null default '[]'::jsonb,
  confidence numeric(5,2) check (confidence between 0 and 100),
  dedupe_key text not null,
  event_at timestamptz,
  discovered_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed','confirmed','dismissed')),
  unique (alert_id,dedupe_key)
);

create table if not exists xps_export_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  requested_by uuid not null references xps_users(id),
  format text not null check (format in ('csv','json')),
  source_list_id uuid references xps_lists(id) on delete set null,
  record_count integer not null default 0,
  field_allowlist jsonb not null default '[]'::jsonb,
  status text not null default 'queued' check (status in ('queued','processing','complete','failed','expired')),
  artifact_path text,
  expires_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists xps_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references xps_organizations(id) on delete cascade,
  entity_key text not null,
  search_request_id uuid,
  outcome_type text not null check (outcome_type in ('contacted','replied','qualified','meeting_booked','proposal_sent','won','lost','invalid_contact','not_a_fit')),
  outcome_value numeric,
  notes text,
  recorded_by uuid not null references xps_users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists xps_outcomes_entity_idx on xps_outcomes(organization_id,entity_key,occurred_at desc);

create table if not exists xps_billing_events (
  event_id text primary key,
  event_type text not null,
  status text not null check (status in ('processing','processed','failed')),
  stripe_created_at timestamptz,
  livemode boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);
create index if not exists xps_billing_events_status_idx on xps_billing_events(status,received_at desc);

alter table xps_organizations enable row level security;
alter table xps_organization_memberships enable row level security;
alter table xps_saved_searches enable row level security;
alter table xps_lists enable row level security;
alter table xps_list_entities enable row level security;
alter table xps_alerts enable row level security;
alter table xps_alert_events enable row level security;
alter table xps_export_jobs enable row level security;
alter table xps_outcomes enable row level security;
alter table xps_billing_events enable row level security;

-- No anon or authenticated-user policies are created here.
-- Before any application of this migration:
-- 1. Confirm xps_users ownership and canonical auth identity.
-- 2. Define current_organization_id() and membership checks.
-- 3. Add least-privilege SELECT/INSERT/UPDATE/DELETE policies per role.
-- 4. Keep xps_billing_events service-role only.
-- 5. Run cross-tenant denial, owner/admin/member/viewer, webhook replay, and rollback tests.
