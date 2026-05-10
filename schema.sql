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
-- places (전역 POI)
-- ------------------------------------------------------------
CREATE TABLE places (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  lat         FLOAT8      NOT NULL,
  lng         FLOAT8      NOT NULL,
  address     TEXT,
  provider    TEXT        NOT NULL DEFAULT 'legacy',
  external_id TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_id)
);

-- ------------------------------------------------------------
-- trip_places (여행-장소 연결 — trip-scoped 메타)
-- ------------------------------------------------------------
CREATE TABLE trip_places (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id    UUID         NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  category    TEXT,
  memo        TEXT,
  status      TEXT         NOT NULL DEFAULT 'wished',
  tags        TEXT[]       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, place_id)
);

-- ------------------------------------------------------------
-- expenses
-- ------------------------------------------------------------
CREATE TABLE expenses (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id     UUID        REFERENCES trip_places(id) ON DELETE SET NULL,
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
  is_public    BOOLEAN     NOT NULL DEFAULT false,
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

-- ------------------------------------------------------------
-- posts (사용자 단위 사진 게시 - feed)
-- ------------------------------------------------------------
CREATE TYPE post_visibility AS ENUM ('PRIVATE', 'MEMBERS', 'PUBLIC');

CREATE TABLE posts (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id         UUID            REFERENCES trips(id) ON DELETE SET NULL,
  title           TEXT,
  description     TEXT,
  cover_photo_id  UUID            REFERENCES photos(id) ON DELETE SET NULL,
  place_id        UUID            REFERENCES places(id) ON DELETE SET NULL,
  location_id     TEXT,
  visibility      post_visibility NOT NULL DEFAULT 'PRIVATE',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ,
  CHECK (NOT (place_id IS NOT NULL AND location_id IS NOT NULL)),
  CHECK (visibility <> 'MEMBERS' OR trip_id IS NOT NULL)
);

CREATE TABLE post_photos (
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  photo_id       UUID NOT NULL REFERENCES photos(id)      ON DELETE CASCADE,
  display_order  INT  NOT NULL,
  PRIMARY KEY (post_id, photo_id)
);

CREATE TABLE post_comments (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID         NOT NULL REFERENCES auth.users(id),
  content     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE TABLE post_likes (
  post_id     UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
