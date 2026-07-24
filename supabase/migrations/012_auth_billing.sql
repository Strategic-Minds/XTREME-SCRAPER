-- Users table
CREATE TABLE IF NOT EXISTS xps_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free_trial',
  plan_status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_starts_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  searches_today INTEGER DEFAULT 0,
  searches_this_month INTEGER DEFAULT 0,
  enrichments_today INTEGER DEFAULT 0,
  last_search_date DATE,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link tokens
CREATE TABLE IF NOT EXISTS xps_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage log
CREATE TABLE IF NOT EXISTS xps_usage_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES xps_users(id),
  action TEXT NOT NULL,
  query TEXT,
  city TEXT,
  results_count INTEGER,
  plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON xps_users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON xps_users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON xps_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_usage_user ON xps_usage_log(user_id);