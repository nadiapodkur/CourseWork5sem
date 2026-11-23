-- Platform-level schema (public): plans, platform accounts, tenants (forums).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE plans (
  code            TEXT PRIMARY KEY,               -- free | pro | business
  name            TEXT NOT NULL,
  max_members     INTEGER NOT NULL,
  storage_gb      INTEGER NOT NULL,
  ai_moderation   BOOLEAN NOT NULL,
  custom_domain   BOOLEAN NOT NULL,
  stripe_price_id TEXT
);

-- Table 4.2 of the technical task
INSERT INTO plans (code, name, max_members, storage_gb, ai_moderation, custom_domain) VALUES
  ('free',     'Free',     100,    1,   FALSE, FALSE),
  ('pro',      'Pro',      5000,   20,  TRUE,  FALSE),
  ('business', 'Business', 50000,  100, TRUE,  TRUE);

CREATE TABLE platform_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT,                            -- null for OAuth-only accounts
  display_name   TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'platform_admin')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  subdomain     TEXT NOT NULL UNIQUE CHECK (subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$'),
  custom_domain TEXT UNIQUE,
  schema_name   TEXT NOT NULL UNIQUE CHECK (schema_name ~ '^tenant_[a-z0-9_]{1,50}$'),
  name          TEXT NOT NULL,
  plan_code     TEXT NOT NULL REFERENCES plans(code) DEFAULT 'free',
  status        TEXT NOT NULL DEFAULT 'provisioning'
                CHECK (status IN ('provisioning', 'active', 'blocked', 'failed')),
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- design + role config (ТЗ F2)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tenants_owner_idx ON tenants(owner_id);
