-- Per-forum schema. Runs with search_path = "<tenant_schema>", public.
-- Unqualified names below are created inside the tenant schema.

CREATE TABLE members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT,
  display_name   TEXT NOT NULL,
  avatar_url     TEXT,
  signature      TEXT,
  role           TEXT NOT NULL DEFAULT 'member'
                 CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  banned_until   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES sections(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  visibility  TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members', 'staff')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  title       TEXT NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  locked      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX topics_section_idx ON topics(section_id, pinned DESC, created_at DESC);

CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  quote_of    UUID REFERENCES posts(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,                          -- Markdown (CommonMark), sanitized on render
  status      TEXT NOT NULL DEFAULT 'published'
              CHECK (status IN ('published', 'pending_review', 'blocked', 'deleted')),
  ai_score    REAL,
  search_tsv  TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', body)) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX posts_topic_idx  ON posts(topic_id, created_at);
CREATE INDEX posts_search_idx ON posts USING GIN (search_tsv);   -- ТЗ п. 4.1.5

CREATE TABLE reactions (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  value      SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (post_id, member_id)
);

CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES members(id) ON DELETE SET NULL,  -- null = raised by AI
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES members(id) ON DELETE SET NULL,  -- null = system / AI
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
