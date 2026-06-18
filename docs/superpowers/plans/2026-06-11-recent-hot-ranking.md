# 최근 핫한곳 랭킹 알고리즘 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방문수 단독 기준 랭킹을 방문수(60%) + 사진수(20%) + 포스트수(20%) 정규화 점수 방식으로 개선하고, `post_photos` 썸네일 버그를 함께 수정한다.

**Architecture:** DB의 `get_explored_places` RPC 함수를 교체 마이그레이션으로 수정해 `photo_count`, `post_count`, `score` 컬럼을 추가한다. `explorer.api.ts`에서 새 컬럼을 타입·매핑에 반영하고, `useRecentHotPlaces`의 정렬·필터 기준을 `score`로 변경한다.

**Tech Stack:** PostgreSQL(Supabase RPC), TypeScript, TanStack Query

---

## File Map

| 파일 | 역할 |
|------|------|
| `supabase/migrations/20260611_explorer_ranking_score.sql` | 신규 마이그레이션 — `get_explored_places` 함수 교체 |
| `src/features/explorer/explorer.api.ts` | `ExploredPlace`, `ExploredPlaceRow` 타입 추가 + 매핑 |
| `src/features/explorer/explorer-recent/useRecentHotPlaces.ts` | 정렬·threshold 기준 `score`로 변경 |

---

### Task 1: SQL 마이그레이션 작성

**Files:**
- Create: `supabase/migrations/20260611_explorer_ranking_score.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- get_explored_places: photo_count / post_count / score 컬럼 추가
-- 썸네일 버그 수정: post_photos → posts → post_locations 경로
CREATE OR REPLACE FUNCTION get_explored_places(since_date DATE DEFAULT NULL)
RETURNS TABLE (
  place_id UUID,
  name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  visitor_count BIGINT,
  destinations JSONB,
  categories JSONB,
  thumbnail_url TEXT,
  total_trips BIGINT,
  photo_count BIGINT,
  post_count BIGINT,
  score DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH filtered_trips AS (
    SELECT id, destinations
    FROM trips
    WHERE since_date IS NULL OR end_date >= since_date
  ),
  route_places AS (
    SELECT
      r.trip_id,
      tp.place_id,
      tp.category
    FROM routes r
    JOIN filtered_trips t ON r.trip_id = t.id
    JOIN LATERAL unnest(r.place_ids) AS tp_id ON TRUE
    JOIN trip_places tp ON tp.id = tp_id
    WHERE tp.category IS DISTINCT FROM 'transit'
  ),
  trip_place_set AS (
    SELECT DISTINCT trip_id, place_id, category
    FROM route_places
  ),
  visit_counts AS (
    SELECT place_id, count(DISTINCT trip_id) AS visitor_count
    FROM trip_place_set
    GROUP BY place_id
  ),
  place_destinations AS (
    SELECT
      rp.place_id,
      jsonb_agg(DISTINCT dest) FILTER (WHERE dest IS NOT NULL) AS destinations
    FROM trip_place_set rp
    JOIN filtered_trips t ON rp.trip_id = t.id
    JOIN LATERAL jsonb_array_elements_text(t.destinations::jsonb) AS dest ON TRUE
    GROUP BY rp.place_id
  ),
  place_categories AS (
    SELECT place_id, jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
    FROM trip_place_set
    GROUP BY place_id
  ),
  photo_counts AS (
    SELECT place_id, count(*) AS photo_count
    FROM photos
    WHERE is_public = true
      AND place_id IN (SELECT place_id FROM visit_counts)
    GROUP BY place_id
  ),
  post_counts AS (
    SELECT pl.place_id, count(DISTINCT p.id) AS post_count
    FROM post_locations pl
    JOIN posts p ON p.id = pl.post_id
    WHERE p.visibility = 'PUBLIC'
      AND pl.place_id IN (SELECT place_id FROM visit_counts)
    GROUP BY pl.place_id
  ),
  thumbnails AS (
    SELECT place_id, url
    FROM (
      SELECT place_id, url, row_number() OVER (PARTITION BY place_id) AS rn
      FROM (
        SELECT ph.place_id, ph.url
        FROM photos ph
        WHERE ph.is_public = true
          AND ph.place_id IN (SELECT place_id FROM visit_counts)
        UNION ALL
        SELECT pl.place_id, pph.url
        FROM post_photos pph
        JOIN posts p ON p.id = pph.post_id
        JOIN post_locations pl ON pl.post_id = p.id
        WHERE p.visibility = 'PUBLIC'
          AND pl.place_id IN (SELECT place_id FROM visit_counts)
      ) all_photos
    ) ranked
    WHERE rn = 1
  ),
  total AS (
    SELECT count(DISTINCT trip_id) AS total_trips FROM route_places
  ),
  score_params AS (
    SELECT
      NULLIF(max(vc.visitor_count), 0)::DOUBLE PRECISION AS max_visitor,
      NULLIF(max(COALESCE(pc.photo_count, 0)), 0)::DOUBLE PRECISION AS max_photo,
      NULLIF(max(COALESCE(po.post_count, 0)), 0)::DOUBLE PRECISION AS max_post
    FROM visit_counts vc
    LEFT JOIN photo_counts pc ON pc.place_id = vc.place_id
    LEFT JOIN post_counts po ON po.place_id = vc.place_id
  )
  SELECT
    p.id AS place_id,
    p.name,
    COALESCE(p.address, '') AS address,
    p.lat,
    p.lng,
    vc.visitor_count,
    COALESCE(pd.destinations, '[]'::jsonb) AS destinations,
    COALESCE(pc2.categories, '[]'::jsonb) AS categories,
    t2.url AS thumbnail_url,
    (SELECT total_trips FROM total) AS total_trips,
    COALESCE(phc.photo_count, 0) AS photo_count,
    COALESCE(poc.post_count, 0) AS post_count,
    (
      COALESCE(vc.visitor_count::DOUBLE PRECISION / sp.max_visitor, 0) * 0.6 +
      COALESCE(phc.photo_count::DOUBLE PRECISION / sp.max_photo, 0) * 0.2 +
      COALESCE(poc.post_count::DOUBLE PRECISION / sp.max_post, 0) * 0.2
    ) AS score
  FROM visit_counts vc
  JOIN places p ON p.id = vc.place_id
  LEFT JOIN place_destinations pd ON pd.place_id = vc.place_id
  LEFT JOIN place_categories pc2 ON pc2.place_id = vc.place_id
  LEFT JOIN thumbnails t2 ON t2.place_id = vc.place_id
  LEFT JOIN photo_counts phc ON phc.place_id = vc.place_id
  LEFT JOIN post_counts poc ON poc.place_id = vc.place_id
  CROSS JOIN score_params sp;
$$;
```

- [ ] **Step 2: Supabase에 마이그레이션 적용**

```bash
npx supabase db push
```

Expected: 에러 없이 마이그레이션 완료

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260611_explorer_ranking_score.sql
git commit -m "feat(db): get_explored_places에 photo_count/post_count/score 컬럼 추가"
```

---

### Task 2: `explorer.api.ts` 타입 및 매핑 업데이트

**Files:**
- Modify: `src/features/explorer/explorer.api.ts`

- [ ] **Step 1: `ExploredPlace` 인터페이스에 필드 추가**

`ExploredPlace` 인터페이스를 아래와 같이 수정:

```typescript
export interface ExploredPlace {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  visitorCount: number
  photoCount: number
  postCount: number
  score: number
  destinations: string[]
  categories: PlaceCategoryTypeValue[]
  thumbnailUrl?: string
}
```

- [ ] **Step 2: `ExploredPlaceRow` 인터페이스에 필드 추가**

`ExploredPlaceRow` 인터페이스를 아래와 같이 수정:

```typescript
interface ExploredPlaceRow {
  place_id: string
  name: string
  address: string
  lat: number
  lng: number
  visitor_count: number
  photo_count: number
  post_count: number
  score: number
  destinations: string[]
  categories: PlaceCategoryTypeValue[]
  thumbnail_url: string | null
  total_trips: number
}
```

- [ ] **Step 3: `callExploredPlaces` 매핑 로직에 필드 추가**

`places` 매핑 부분을 아래와 같이 수정:

```typescript
const places = rows.map((row) => ({
  placeId: row.place_id,
  name: row.name,
  address: row.address ?? '',
  lat: row.lat,
  lng: row.lng,
  visitorCount: row.visitor_count,
  photoCount: row.photo_count,
  postCount: row.post_count,
  score: row.score,
  destinations: row.destinations ?? [],
  categories: row.categories ?? [],
  thumbnailUrl: row.thumbnail_url ?? undefined,
}))
```

- [ ] **Step 4: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/explorer/explorer.api.ts
git commit -m "feat(explorer): ExploredPlace에 photoCount/postCount/score 필드 추가"
```

---

### Task 3: `useRecentHotPlaces` 정렬·threshold 기준 변경

**Files:**
- Modify: `src/features/explorer/explorer-recent/useRecentHotPlaces.ts`

- [ ] **Step 1: 정렬 및 threshold 기준을 `score`로 변경**

`queryFn` 내부를 아래와 같이 수정:

```typescript
queryFn: async () => {
  const { places } = await getRecentHotPlaces(inquiryMonths)
  if (places.length === 0) return []
  const maxScore = Math.max(...places.map((p) => p.score))
  const threshold = maxScore / 2
  return places
    .filter((p) => p.score >= threshold)
    .toSorted((a, b) => b.score - a.score)
},
```

- [ ] **Step 2: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/explorer/explorer-recent/useRecentHotPlaces.ts
git commit -m "feat(explorer): 랭킹 정렬 기준을 visitorCount에서 score로 변경"
```
