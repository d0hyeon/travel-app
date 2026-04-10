-- ============================================================
-- Travel App — Base Schema
-- 현재 프로덕션 스키마 기준 (user 기반 마이그레이션 전)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- trips
-- ------------------------------------------------------------
CREATE TABLE trips (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  destination   TEXT        NOT NULL,
  start_date    TEXT        NOT NULL,
  end_date      TEXT        NOT NULL,
  lat           FLOAT8      NOT NULL,
  lng           FLOAT8      NOT NULL,
  is_overseas   BOOLEAN     NOT NULL DEFAULT false,
  exchange_rate FLOAT8,
  exchange_rates JSONB,
  share_link    TEXT        NOT NULL DEFAULT uuid_generate_v4()::text,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- trip_members
-- ------------------------------------------------------------
CREATE TABLE trip_members (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  emoji      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- places
-- ------------------------------------------------------------
CREATE TABLE places (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  lat        FLOAT8      NOT NULL,
  lng        FLOAT8      NOT NULL,
  address    TEXT,
  category   TEXT,
  memo       TEXT,
  status     TEXT        NOT NULL DEFAULT 'candidate',
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- expenses
-- ------------------------------------------------------------
CREATE TABLE expenses (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id     UUID        REFERENCES places(id) ON DELETE SET NULL,
  description  TEXT,
  total_amount FLOAT8      NOT NULL,
  currency     TEXT,
  payments     JSONB       NOT NULL DEFAULT '[]',
  split_among  TEXT[]      NOT NULL DEFAULT '{}',
  date         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- routes
-- ------------------------------------------------------------
CREATE TABLE routes (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id        UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  place_ids      TEXT[]      NOT NULL DEFAULT '{}',
  place_memos    JSONB       NOT NULL DEFAULT '{}',
  hidden_places  TEXT[],
  is_main        BOOLEAN     NOT NULL DEFAULT false,
  scheduled_date TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- memos
-- ------------------------------------------------------------
CREATE TABLE memos (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  is_pinned  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- photos
-- ------------------------------------------------------------
CREATE TABLE photos (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id     UUID        REFERENCES places(id) ON DELETE SET NULL,
  url          TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- checklist
-- ------------------------------------------------------------
CREATE TABLE checklist (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content      TEXT,
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  member_id    TEXT,
  started_at   TEXT,
  ended_at     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
