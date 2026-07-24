-- XPS Intelligence identity prerequisites.
-- Apply only in an isolated Supabase development branch until validation passes.
-- This schema supports the existing custom magic-link auth flow used by the application.

create extension if not exists pgcrypto;

create table if not exists xps_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null default '',
  plan text not null default 'free_trial' check (plan in ('anonymous','free_trial','starter','pro','elite')),
  plan_status text not null default 'active' check (plan_status in ('active','trialing','past_due','canceled','suspended')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  searches_today integer not null default 0 check (searches_today >= 0),
  searches_this_month integer not null default 0 check (searches_this_month >= 0),
  enrichments_today integer not null default 0 check (enrichments_today >= 0),
  last_search_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists xps_users_email_lower_uidx on xps_users (lower(email));

create table if not exists xps_magic_links (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists xps_magic_links_lookup_idx on xps_magic_links(token, used, expires_at);
create index if not exists xps_magic_links_email_idx on xps_magic_links(lower(email), created_at desc);

create table if not exists xps_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references xps_users(id) on delete cascade,
  action text not null check (action in ('search','enrich','person')),
  plan text not null default 'free_trial',
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);
create index if not exists xps_usage_log_user_action_idx on xps_usage_log(user_id, action, created_at desc);

alter table xps_users enable row level security;
alter table xps_magic_links enable row level security;
alter table xps_usage_log enable row level security;

-- No anon/authenticated policies are intentionally created.
-- The current application accesses these tables only through server-side service-role requests.
-- Tenant-aware direct PostgREST policies must not be added until the project adopts a canonical
-- Supabase Auth identity or another verified database-session identity mapping.