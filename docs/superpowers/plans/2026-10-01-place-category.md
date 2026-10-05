# 장소 카테고리 저장·상속 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오·구글 검색 결과의 카테고리를 우리 `PlaceCategoryType`으로 매핑해 `places.category`에 저장하고, `trip_places` 등록 시 상속한다.

**Architecture:** edge function(`place-search`)은 제공자 원본 카테고리만 내려주고, `@waylog/domains`의 `searchPlaces()`가 순수 함수 `toPlaceCategory`로 변환해 `PlaceResult.category`로 노출한다. `upsertPlace`가 저장하며 이미 존재하는 행의 category가 비어 있으면 patch한다. `createTripPlace`가 category를 명시하지 않으면 place의 값을 상속한다. 탐색 SQL은 변경하지 않는다.

**Tech Stack:** Supabase(Postgres, Edge Function/Deno), TypeScript, Vitest, pnpm workspace

**Spec:** 이 대화의 설계 합의 (별도 spec 문서 없음)

## Global Constraints

- 커밋하지 않는다 (사용자 지시). 변경은 워킹트리에만 남긴다.
- 코드에 주석을 남기지 않는다.
- 타입 단언(`as`)을 쓰지 않는다. 불변 배열 메서드를 우선한다.
- `places.category`는 nullable `text`, DB check 제약 없음 (`trip_places.category`와 동일).
- 원격 DB에 마이그레이션을 적용하지 않고, edge function을 배포하지 않는다.
- 도메인 패키지는 환경변수·브라우저 API에 의존하지 않는다.

## Review Focus

- 제공자가 카테고리를 주지 않음(카카오 `category_name` 빈 값, 구글 `primaryType`·`types` 모두 없음) → `undefined`, `기타`로 오분류하지 않는다
- 원본은 있으나 어느 규칙에도 안 걸림 → `기타`
- 구글 `primaryType`이 null/범용(`point_of_interest`)일 때 `types` 순서로 폴백
- 구글 `japanese_izakaya_restaurant`는 `*_restaurant` 규칙보다 먼저 `술`로 분류 (규칙 순서)
- 카카오 `교통,수송 > 교통시설 > 주차장`, `자동차 > 주유,가스`는 대중교통이 아니다
- `upsertPlace`가 기존 행의 category가 이미 있으면 덮어쓰지 않는다
- `createTripPlace`에서 명시한 category가 place.category보다 우선한다

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/20261001120000_add_places_category.sql` | `places.category` 컬럼 추가 |
| `supabase/functions/place-search/index.ts` | 제공자 원본 카테고리 전달 (변환하지 않음) |
| `packages/domains/src/modules/place/place.types.ts` | `PlaceCategoryType.공원`, 색상, `Place.category` |
| `packages/domains/src/modules/place/placeCategory.utils.ts` (신규) | 제공자 원본 카테고리 → `PlaceCategoryType` 변환 규칙 |
| `packages/domains/src/modules/place/placeSearch.api.ts` | 응답을 변환해 `PlaceResult.category` 노출 |
| `packages/domains/src/modules/place/place.api.ts` | `toPlace`, `upsertPlace`(저장 + null patch), `createTripPlace`(상속) |
| `packages/domains/src/modules/trip/useTripPlaces.ts` | `AddTripPlacePayload`가 category를 `upsertPlace`로 전달 |
| 웹 `PostPlacesField.tsx`, 앱 `usePostPlacesBottomSheet.tsx` | 검색 결과의 category를 `upsertPlace`로 전달 |
| `docs/codebase.md` | 변경 반영 |

## Task 1: 타입·스키마 (웨이브 1)

**Files:** `place.types.ts`, `_database.types.ts`, `supabase/schema.sql`, `supabase/migrations/20261001120000_add_places_category.sql`

**Produces:**
- `PlaceCategoryType.공원 = 'park'`, `PlaceCategoryColorCode[park]`
- `Place.category?: PlaceCategoryType`
- DB 타입 `places.Row.category: string | null`

- [ ] 마이그레이션 SQL 작성, 생성 타입·schema.sql 수동 동기화 (원격 미적용이라 gen-types 불가)
- [ ] `pnpm ts-check`로 `satisfies Record<PlaceCategoryType, string>` 통과 확인

## Task 2: 카테고리 변환 규칙 (웨이브 1, 방식 A: 설계 우선 TDD)

**Files:** Create `placeCategory.utils.ts`, `__tests__/placeCategory.utils.test.ts`

**Produces:**

```ts
export type ProviderCategory =
  | { provider: 'kakao'; categoryName?: string }
  | { provider: 'google'; primaryType?: string; types?: string[] }

export function toPlaceCategory(source: ProviderCategory): PlaceCategoryType | undefined
```

**검증 케이스 (`it.todo` 제목):**
- 카카오: 술집/카페/음식점 구분, 숙소(캠핑 포함), 해변→바다, 산·산봉우리·오름·등산로→산, 공원→공원, 숲·휴양림→숲, 테마파크·스포츠·레저→액티비티, 백화점·마트·편의점·시장→쇼핑, 지하철·기차·공항·버스→대중교통, 문화유적·전망대·박물관→관광지, 주차장·주유소·이벤트→기타, 빈 값→undefined
- 구글: 규칙 순서(이자카야→술), 접미사 규칙(`*_restaurant`, `*_store`, `*_station`), 폴백(primary null·범용 → types), 전부 범용→기타, 값 없음→undefined
- 실측 사례 회귀: 해운대(바다)·북한산(산)·서울숲(공원)·에버랜드(액티비티)·경복궁(관광지)·서울역(대중교통)

- [ ] `it.todo`로 제목 작성 → 하나씩 실제 테스트로 채우고 실패 확인 → 최소 구현

## Task 3: edge function (웨이브 1)

**Files:** `supabase/functions/place-search/index.ts`

**Produces:** 응답 결과 항목에 카카오 `categoryName`, 구글 `primaryType`·`types` 추가 (FieldMask 확장, 같은 Text Search Pro SKU)

## Task 4: 도메인 연결 (웨이브 2, Task 1·2·3 이후)

**Files:** `placeSearch.api.ts`, `place.api.ts`, `useTripPlaces.ts`, `PostPlacesField.tsx`, `usePostPlacesBottomSheet.tsx`, `__tests__/placeSearch.api.test.ts`, `docs/codebase.md`

**Consumes:** `toPlaceCategory`, `Place.category`

**Produces:**
- `PlaceResult.category?: PlaceCategoryType` (원본 필드는 노출하지 않는다)
- `upsertPlace(provider, externalId, data: { name; address; lat; lng; category?: PlaceCategoryType })`
- `createTripPlace`: `params.category ?? place.category ?? null`

**검증 케이스 (`it.todo` 제목):**
- `searchPlaces`가 카카오 `categoryName`을 `category`로 변환해 반환한다
- `searchPlaces`가 구글 `primaryType`·`types`를 `category`로 변환해 반환한다
- `searchPlaces`가 원본 카테고리 필드를 결과에 노출하지 않는다
- `upsertPlace`가 신규 장소에 category를 저장한다
- `upsertPlace`가 기존 장소의 category가 null이면 patch한다
- `upsertPlace`가 기존 장소의 category가 있으면 덮어쓰지 않는다
- `createTripPlace`가 category를 생략하면 place.category를 상속한다
- `createTripPlace`가 명시한 category를 우선한다

- [ ] 위 순서로 TDD, 이후 `pnpm test`, `pnpm ts-check`, `pnpm lint`
- [ ] `docs/codebase.md` 갱신

## 웨이브

- 웨이브 1 (파일이 겹치지 않음): Task 1, Task 2, Task 3
- 웨이브 2: Task 4
