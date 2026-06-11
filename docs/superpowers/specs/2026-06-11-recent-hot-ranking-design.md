# 최근 핫한곳 랭킹 알고리즘 개선 설계

**날짜:** 2026-06-11  
**상태:** 승인됨

---

## 배경

기존 `RecentHotPage`의 랭킹은 `visitor_count`(방문 여행 수)만 기준으로 삼았다. 장소의 실제 인기도를 더 잘 반영하기 위해 사진 수와 포스트 게시 횟수를 가중치로 추가한다.

또한 기존 `get_explored_places` SQL의 썸네일 쿼리에서 `post_photos`를 `place_id`로 직접 조회하는 버그가 있다. `posts.place_id`는 `post_locations` 마이그레이션으로 이미 제거됐으므로, `post_photos → posts → post_locations` 경로로 수정해야 한다.

---

## 점수 계산 방식

### 공식

```
score = (visitor_count / max_visitor × 0.6)
      + (photo_count   / max_photo   × 0.2)
      + (post_count    / max_post    × 0.2)
```

- 각 요소를 해당 쿼리 결과 내 최댓값으로 나눠 **0~1 정규화** 후 가중 합산
- 최댓값이 0인 경우(데이터 없음) 해당 요소는 0으로 처리
- `score`는 `DOUBLE PRECISION` (0.0 ~ 1.0)

### 가중치 근거

| 요소 | 가중치 | 이유 |
|------|--------|------|
| visitor_count | 60% | 실제 방문 행동이 인기의 핵심 신호 |
| photo_count | 20% | 장소에 남긴 사진 수로 체류 관심도 반영 |
| post_count | 20% | 공개 포스트 게시 횟수로 공유 의지 반영 |

---

## 변경 범위

### 1. SQL 마이그레이션 — `get_explored_places` 함수 수정

**추가할 CTE:**

- `photo_counts` — `photos` 테이블에서 `place_id`별 사진 수 집계
- `post_counts` — `post_locations` 테이블에서 `place_id`별 공개 포스트 수 집계  
  (`post_locations → posts WHERE visibility = 'PUBLIC'`)
- `score_params` — `max_visitor`, `max_photo`, `max_post` 최댓값 계산

**변경할 SELECT:**

- `photo_count`, `post_count`, `score` 컬럼 추가
- `score = (vc.visitor_count / NULLIF(sp.max_visitor, 0) × 0.6) + ...`

**버그 수정:**

- 기존 썸네일 쿼리의 `post_photos WHERE place_id IN (...)` 조건 제거
- `post_photos → posts → post_locations`로 join 경로 수정

**RETURNS TABLE에 추가:**

```sql
photo_count  BIGINT,
post_count   BIGINT,
score        DOUBLE PRECISION
```

### 2. `explorer.api.ts`

- `ExploredPlace` 인터페이스에 `photoCount: number`, `postCount: number`, `score: number` 추가
- `ExploredPlaceRow`에 `photo_count`, `post_count`, `score` 추가
- `callExploredPlaces` 매핑 로직에 세 필드 추가

### 3. `useRecentHotPlaces.ts`

- 정렬 기준: `visitorCount` → `score`
- threshold 기준: `max(visitorCount) / 2` → `max(score) / 2`

---

## 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `supabase/migrations/YYYYMMDD_ranking_score.sql` | 신규 마이그레이션 |
| `src/features/explorer/explorer.api.ts` | 타입 및 매핑 수정 |
| `src/features/explorer/explorer-recent/useRecentHotPlaces.ts` | 정렬/필터 기준 수정 |

---

## 고려사항

- `photos` 테이블에는 `is_public` 컬럼이 있어 공개 사진만 집계 가능
- `post_count`는 `visibility = 'PUBLIC'`인 포스트만 집계
- `score` 정규화는 **같은 쿼리 결과 내** 최댓값 기준 → 기간(inquiryMonths)이 바뀌면 자동으로 재정규화됨
- 기존 `getExploredPlaces()`(전체 기간)도 동일 함수를 사용하므로 해당 뷰에도 score가 추가됨; 현재 최다방문순 랭킹은 `visitorCount` 기준을 그대로 유지
