# 경로 탭 장소 수정 시트 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 경로 탭의 장소 수정 바텀시트를 `일정` / `장소 정보` 두 탭으로 개편하고, 경로의 장소마다 시작·종료 시간(각각 nullable)을 저장한다.

**Architecture:** 시간은 "언제 방문하는가"라 `Place`가 아니라 `Route`가 소유한다(`routes.place_times` jsonb, `place_memos`와 같은 blob 방식). 시간과 경로 메모는 `updateRoutePlace` 한 번의 쓰기로 저장해 같은 행에 대한 쓰기 경합을 만들지 않는다. 앱 시트는 `일정` 탭(시간·경로 메모)과 기존 `PlaceForm`(장소 정보 탭)을 한 시트에서 조정하고, 저장은 경로 쓰기 → 장소 폼 submit 순서다.

**Tech Stack:** TypeScript, Supabase(jsonb), TanStack Query, React Native(Expo), react-hook-form, Vitest

**Spec:** Claude Design `Place Edit Sheet.html` (project 019e017f-bf39-7402-adb1-8539bc541197). v2 파일은 채택하지 않는다.

## Global Constraints

- 시간 값은 `'HH:mm'` 문자열 또는 `null`. 시작·종료는 서로 독립적으로 nullable
- 둘 다 있으면 종료가 시작보다 뒤여야 한다(같은 날 안). 위반 시 저장 불가
- 경로 메모는 시트에서 한 개의 텍스트 영역이며 저장은 줄 단위 `string[]`(`placeMemos`)로 한다
- 일정(시간·경로 메모)은 파란색, 장소 정보(주소·장소 메모)는 회색. 경로 메모는 있을 때만 리스트에 보인다
- 코드에 주석을 남기지 않는다. 커밋·푸시는 사용자가 요청할 때까지 하지 않는다
- 원격 DB 적용(`db push`)은 하지 않는다. 마이그레이션 파일만 작성한다

## Review Focus

- 시작만 있고 종료가 없는 장소 → 리스트에 `14:00~` 표시
- 종료만 있는 장소 → `~11:30`으로 표시, 소요시간 라벨은 숨김
- 종료 ≤ 시작 → 시트에서 에러 문구 + 저장 비활성
- `place_times` 컬럼이 없는 응답/깨진 JSON → 빈 객체로 정규화(앱이 죽지 않음)
- 경로에서 빠진 장소의 `placeTimes` 잔여 항목 → 무시(`placeMemos`와 같은 정책)

## File Structure

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/20261008000000_add_route_place_times.sql` | `routes.place_times` 컬럼 |
| `packages/domains/src/modules/route/route.types.ts` | `RoutePlaceTime`, `Route.placeTimes` |
| `packages/domains/src/modules/route/routePlaceTime.utils.ts` | 시간 정규화·검증·표시 (순수) |
| `packages/domains/src/modules/route/route.api.ts` | `place_times` 읽기/쓰기 |
| `packages/domains/src/modules/trip/useTripRoutes.ts` | `updateRoutePlace` |
| `apps/waylog-app/src/shared/components/date-picker/*` | `time` 타입(시각만 선택) |
| `apps/waylog-app/src/features/trip/trip-route/trip-route-place/` | `RoutePlaceEditSheet`, `RoutePlaceScheduleFields`, `useRoutePlaceEditOverlay` |
| `apps/waylog-app/src/features/trip/trip-route/components/TripRoutePlaceListItem.tsx` | 시간·경로 메모 표시, 수정 진입점 교체 |

웹 UI는 이번 범위 밖이다(디자인이 네이티브 시트). 웹은 `placeTimes`를 건드리지 않고 `createRoute` 기본값만 받는다.

## Task 1: 도메인 — 경로 장소 시간

**Interfaces:**
- Produces: `RoutePlaceTime { startTime: string | null; endTime: string | null }`, `Route.placeTimes: Record<string, RoutePlaceTime>`, `EMPTY_ROUTE_PLACE_TIME`, `normalizePlaceTimes(json: Json): Record<string, RoutePlaceTime>`, `isValidRoutePlaceTime(time): boolean`, `getRoutePlaceTimeMinutes(time): number | null`, `formatRoutePlaceTime(time): string | null`, `useTripRoutes().updateRoutePlace({ routeId, placeId, time, memos })`

검증 케이스 (`routePlaceTime.utils.test.ts`):
- `normalizePlaceTimes`: 형식이 맞는 값만 남기고 깨진 값은 버린다 / null·배열 입력은 빈 객체
- `isValidRoutePlaceTime`: 둘 다 null 이면 유효 / 한쪽만 있으면 유효 / 종료가 시작보다 뒤면 유효 / 같거나 앞서면 무효 / 형식이 틀리면 무효
- `getRoutePlaceTimeMinutes`: 둘 다 있을 때만 분 단위 길이
- `formatRoutePlaceTime`: 둘 다 → `10:00–11:30` / 시작만 → `14:00` / 종료만 → `~11:30` / 없음 → null

## Task 2: 앱 — 시각 선택 타입

`DatePickerBottomSheet`/`DatePicker`/`useDatePickerBottomSheet`에 `type: 'time'`을 추가해 시각 단계부터 시작한다. `openTime({ defaultValue })`는 `'HH:mm' | null`을 돌려준다.

## Task 3: 앱 — 수정 시트와 리스트

`useRoutePlaceEditOverlay().open({ tripId, routeId, placeId })`. 경로 탭의 두 진입점(리스트 `수정`, 지도 마커 `장소 수정`)을 교체하고, 리스트 카드에 시간·경로 메모를 표시한다. 앱 `RouteNoteList`(NoteEditor)는 시트로 편집이 옮겨가 삭제한다.

## 마무리

`docs/codebase.md` 갱신, 도메인 테스트·`ts-check` 통과 확인. 커밋하지 않는다.
