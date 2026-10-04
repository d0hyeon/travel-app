# 장소 북마크 구현 플랜

> 2026-06-06 의 `bookmark` 스펙·플랜(IndexedDB, 웹 전용)을 대체한다. 앱(RN)에는 IndexedDB 가 없고
> 기기 간 공유도 안 되므로 Supabase 서버 저장으로 간다.

**Goal:** 장소 CTA 에 북마크 아이콘 버튼을 두고, 북마크한 장소를 "저장된 장소" 화면에서 모아 본다.
화면은 설정 > 저장된 장소로 진입한다. 웹(데스크탑·모바일)과 앱 모두 적용한다.

**전략:** B (여러 파일·계층, 순서 조율 필요). 테스트 본문은 실행 시점에 A 의 3단계로 채운다.

---

## 설계 결정

| 결정 | 근거 |
| --- | --- |
| 서버 저장(`place_bookmarks`) | 웹·앱 공유 + 기기 간 동기화. 도메인 로직은 `@waylog/domains` 한 곳 |
| 모듈 이름 `place-bookmark` | 기존 "저장"(= 여행에 담김, `most-saved`·`explorer-saved`)과 구분. UI 문구만 "저장된 장소" |
| 북마크는 여행 담기와 독립 | `trip_places` 와 무관. 예정된 여행이 없어도 북마크는 가능해야 한다 |
| 라우트 `/settings/bookmarks` | `차단_목록`(`/settings/blocks`) 선례. 웹은 SettingsLayout 아래 |
| 비로그인 | 상세 화면은 게스트에게 열려 있다. 버튼은 보이되 누르면 로그인 유도. 조회는 `[]` |
| 목록 상태는 쿼리 하나 | `usePlaceBookmark` 은 목록 쿼리에서 포함 여부를 파생한다. 장소별 요청 없음 |

## CTA 구조 변경 (놓치기 쉬운 부분)

현재 웹·앱 모두 CTA 영역이 `scheduledTrips.length > 0` 일 때만 렌더링된다.
북마크 버튼을 그 안에 넣으면 **예정된 여행이 없는 사용자는 북마크를 못 한다.**
CTA 영역은 항상 렌더링하고, 안에서 `[북마크] [내 여행에 담기(예정 여행이 있을 때만)]`로 구성한다.

---

## File Map

```
supabase/migrations/20261004070000_place_bookmarks.sql           [신규] 테이블 + RLS
packages/domains/src/gateways/client/_database.types.ts          [수정] place_bookmarks 타입 (생성 파일)
packages/routes/src/appRoute.ts                                  [수정] 저장된_장소: "/settings/bookmarks"

packages/domains/src/modules/place/place.api.ts                  [수정] getPlacesByIds 추가
packages/domains/src/modules/place-bookmark/
  index.ts                                                       [신규]
  placeBookmark.api.ts                                           [신규]
  usePlaceBookmark.ts                                            [신규] usePlaceBookmark · useBookmarkedPlaces
  __tests__/placeBookmark.api.test.ts                            [신규]

apps/waylog-web/src/features/place/
  PlaceBookmarkButton.tsx                                        [신규] 아이콘 토글 버튼
  PlaceInfoWIdget.tsx                                            [수정] CTA 영역 상시 렌더 + 북마크 버튼
apps/waylog-web/src/features/place/place-bookmark/
  BookmarkedPlacesPage.tsx                                       [신규] 저장된 장소 화면
apps/waylog-web/src/features/settings/SettingsPage.tsx           [수정] "저장된 장소" 항목
apps/waylog-web/src/app/routes.ts                                [수정] 라우트 등록

apps/waylog-app/src/features/place/
  PlaceBookmarkButton.tsx                                        [신규]
  place-detail/PlaceDetailSheet.tsx                              [수정] CTA 영역 상시 렌더
apps/waylog-app/src/features/explorer/PlaceDetailScreen.tsx      [수정] CTA 영역 상시 렌더
apps/waylog-app/src/features/place/BookmarkedPlacesScreen.tsx    [신규]
apps/waylog-app/src/features/settings/SettingsScreen.tsx         [수정] "저장된 장소" 항목
apps/waylog-app/src/app/RootNavigator.tsx                        [수정] 스크린 등록

docs/codebase.md                                                 [수정] 마지막
```

## 인터페이스

```ts
// place-bookmark/placeBookmark.api.ts
export const placeBookmarkKey = 'place-bookmarks'
export function addPlaceBookmark(placeId: string): Promise<void>      // 이미 있으면 성공 처리
export function removePlaceBookmark(placeId: string): Promise<void>
export function getBookmarkedPlaces(): Promise<Place[]>               // 최근 북마크순, 비로그인이면 []

// place-bookmark/usePlaceBookmark.ts
export function useBookmarkedPlaces(): UseSuspenseQueryResult<Place[]>
export function usePlaceBookmark(placeId: string): {
  isBookmarked: boolean
  toggle: () => Promise<void>
}

// place/place.api.ts
export function getPlacesByIds(ids: string[]): Promise<Place[]>

// UI (웹·앱 동일) — placeId 로 스스로 상태를 조회하고 토글·토스트·로그인 유도를 내부에서 완결
<PlaceBookmarkButton placeId={string} />
```

스키마:

```sql
place_bookmarks (
  user_id    uuid  → auth.users(id)  ON DELETE CASCADE,
  place_id   uuid  → places(id)      ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
)
-- RLS: select/insert/delete 모두 user_id = auth.uid(), anon 권한 회수 (user_blocks 와 동일)
-- INDEX (user_id, created_at DESC)
```

---

## 웨이브

| 웨이브 | 태스크 | 병렬 근거 |
| --- | --- | --- |
| 1 | T1 DB·타입, T2 라우트 상수 | 서로 다른 파일 |
| 2 | T3 도메인 모듈 | T1 의 테이블 타입 필요 |
| 3 | T4 웹, T5 앱 | 파일 겹침 없음, 둘 다 T2·T3 만 의존 |
| 4 | T6 문서 | 전체 완료 후 |

### T1. DB 마이그레이션 + 타입

- `place_bookmarks` 테이블, RLS, 인덱스, 권한 (`user_blocks` 마이그레이션과 동일 패턴)
- `_database.types.ts` 는 생성 파일이므로 `pnpm gen-types`. 로컬 DB 가 없으면 `user_blocks` 항목 형식에 맞춰 반영하고 보고한다
- 검증: `pnpm ts-check`

### T2. 라우트 상수

- `AppRoute.저장된_장소 = "/settings/bookmarks"` 추가
- 검증: `pnpm ts-check` (웹·앱 라우트 매핑이 누락되면 타입 에러로 드러난다)

### T3. 도메인 모듈 `place-bookmark`

검증 케이스 (`placeBookmark.api.test.ts`, `userBlock.api.test.ts` 의 mock 방식을 따른다):

- `it.todo('addPlaceBookmark: 로그인 사용자와 장소를 place_bookmarks 에 저장한다')`
- `it.todo('addPlaceBookmark: 이미 북마크한 장소면 성공으로 처리한다')`
- `it.todo('addPlaceBookmark: 세션이 없으면 인증 만료 에러를 던진다')`
- `it.todo('removePlaceBookmark: 내 북마크만 삭제한다')`
- `it.todo('getBookmarkedPlaces: 최근 북마크한 순서로 장소를 돌려준다')`
- `it.todo('getBookmarkedPlaces: 북마크가 없으면 장소를 조회하지 않고 빈 배열을 돌려준다')`
- `it.todo('getBookmarkedPlaces: 비로그인이면 쿼리 없이 빈 배열을 돌려준다')`
- `it.todo('getPlacesByIds: 존재하는 장소만 돌려준다')` (place 모듈 테스트)

훅: `usePlaceBookmark` 은 `useBookmarkedPlaces` 에서 포함 여부를 파생하고, `toggle` 은 add/remove 후
`[placeBookmarkKey]` 를 무효화한다. mutation 은 `Object.assign(mutation.mutateAsync, mutation)` 패턴.
(React Query 훅이라 순수 로직은 api 쪽에 두고 훅은 테스트하지 않는다)

### T4. 웹

- `PlaceBookmarkButton`: `IconButton` + `BookmarkBorder`/`Bookmark` 아이콘. 비로그인이면 로그인 유도(기존 `auth-redirect` 패턴 확인),
  성공 시 `toast.success('저장했어요')` / `toast('저장을 해제했어요')`
- `PlaceInfoWidget`: `BottomArea` 상시 렌더. `[PlaceBookmarkButton] [내 여행에 담기]`. 사이드패널·풀스크린·페이지 3곳이
  이 위젯을 공유하므로 **데스크탑·모바일 모두 여기 한 곳에서 해결된다**
- `BookmarkedPlacesPage`: `TopNavigation` "저장된 장소" + 목록. 빈 상태 "저장한 장소가 없어요".
  항목 탭 → `usePlaceDetailOverlay`. 항목에는 `PlaceBookmarkButton` 을 둬 목록에서 바로 해제.
  기존 `explorer-place-item/PlaceListItem` 의 props 를 먼저 확인해 맞으면 재사용, 아니면 신설
- `SettingsPage`: "저장된 장소" 항목(`BookmarkBorderIcon`), "차단한 사용자" 위
- 검증: `pnpm ts-check`, 웹 빌드, 브라우저에서 데스크탑 사이드패널·모바일 풀스크린·`/place/:id` 3경로 + 설정 진입 확인

### T5. 앱

- `PlaceBookmarkButton`: `MaterialIcons` `bookmark-border`/`bookmark`, `sonner-native` 토스트
- `PlaceDetailSheet`·`PlaceDetailScreen`: CTA 영역 상시 렌더. `AddTripButton` 은 기존처럼 예정 여행이 있을 때만
- `BookmarkedPlacesScreen`: `BlockedUsersScreen` 구조(`AuthGuard`+`SignedOutRedirect`+`AppBar`+`FlatList`). 항목 탭 → `AppRoute.장소_상세`
- `SettingsScreen`: "저장된 장소" 항목 / `RootNavigator`: 스크린 등록 / `RouteParamsRegistry` 선언
- 검증: `pnpm ts-check`, 시뮬레이터에서 시트·상세 화면·설정 진입 확인 (UI 컴포넌트라 테스트 대신 실기 확인)

### T6. 문서

- `docs/codebase.md`: `place-bookmark` 모듈, 라우트 `/settings/bookmarks`, 웹·앱 파일, "저장"과 "북마크" 용어 구분

---

## 선행 조건 / 주의

- **작업 트리에 미커밋 변경이 있다.** `PlaceDetailSheet.tsx`, `PlaceDetailScreen.tsx`, `useTripSelectSheet.tsx`,
  `AddTripButton.tsx`(신규), `PlaceAddress.tsx`(신규), `docs/codebase.md` 가 이미 수정 중이며, T5·T6 이 같은 파일을 건드린다.
  그 변경은 내 것이 아니므로 **임의로 커밋·되돌리지 않고**, 위 변경 위에 얹어 작업한다. 커밋 시 포함 여부는 사용자가 정한다
- 커밋은 요청이 있을 때만 한다. 요청 시 단위: ① DB ② 라우트 ③ 도메인 ④ 웹 ⑤ 앱 ⑥ 문서(각 변경 설명 문서는 해당 커밋에 포함 가능)
- 워크트리는 만들지 않는다 (현재 브랜치 `feat/monorepo-react-native` 에서 진행)
