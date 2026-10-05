# Waylog Shared Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공용 유틸리티와 타입을 `@waylog/utility`로 통합하고 모든 소비자를 새 경계로 전환한다.

**Architecture:** 공용 타입과 이를 사용하는 순수 런타임 함수를 모두 `@waylog/utility`에 둔다. 도메인 전용 함수와 TanStack Query 결합 코드는 `@waylog/domains`에 유지한다.

**Tech Stack:** pnpm workspace, TypeScript 5.9, Vitest, date-fns.

**Spec:** `docs/superpowers/specs/2026-08-22-waylog-shared-packages-design.md`

## Global Constraints

- 새 패키지는 React, DOM, Supabase, TanStack Query에 의존하지 않는다.
- 기존 도메인 전용 유틸리티는 이동하지 않는다.
- `@waylog/domains/utils` 레거시 import는 최종적으로 0건이어야 한다.
- 작업 완료 후 `docs/codebase.md`에 패키지 경계를 반영한다.

### Task 1: 공용 패키지 스캐폴딩

**Files:**
- Create: `packages/utility/package.json`, `packages/utility/tsconfig.json`, `packages/utility/src/index.ts`, `packages/utility/src/*.ts`
- Modify: `packages/domains/package.json`

- [ ] `@waylog/utility`에 `Coordinate`, 타입 헬퍼와 순수 유틸을 함께 추가한다.
- [ ] `domains`에서 `date-fns`를 제외한 새 공용 패키지 의존성을 선언한다.
- [ ] 각 패키지의 `tsconfig`가 루트 설정과 기존 패키지 패턴을 따른다.
- [ ] `pnpm --filter @waylog/utility ts-check`를 실행한다.

### Task 2: domains 내부 import 전환 및 레거시 utils 제거

**Files:**
- Modify: `packages/domains/src/**/*.ts`
- Delete: `packages/domains/src/utils/common.ts`, `coordinate.ts`, `formats.ts`, `geo.ts`, `types.ts`, `urls.ts`, `index.ts`
- Keep: `packages/domains/src/utils/merges.ts` and update its imports/exports if needed

- [ ] 공용 함수와 타입 import를 `@waylog/utility`로 바꾼다.
- [ ] `mergeQueriesResults`, `mergeQueriesStatus`는 domains 내부 위치에 남긴다.
- [ ] domains의 외부 export가 도메인 모듈을 통해서만 노출되도록 확인한다.
- [ ] domains 테스트와 타입 검사를 실행한다.

### Task 3: 웹·앱 소비자 전환

**Files:**
- Modify: `apps/waylog-web/src/**/*.ts`, `apps/waylog-web/src/**/*.tsx`
- Modify: `apps/waylog-app/src/**/*.ts`, `apps/waylog-app/src/**/*.tsx`

- [ ] `@waylog/domains/utils`의 함수 import를 `@waylog/utility`로 전환한다.
- [ ] `Coordinate`와 공용 타입 import를 `@waylog/utility`로 전환한다.
- [ ] 앱의 URL wrapper처럼 단순 재-export만 하는 모듈은 새 패키지를 직접 참조하도록 정리한다.
- [ ] 앱별 도메인/UI 전용 유틸은 이동하지 않는다.
- [ ] 레거시 import 검색 결과가 0건인지 확인한다.

### Task 4: 테스트·문서·최종 검증

**Files:**
- Modify: `docs/codebase.md`
- Modify/Create: 공용 패키지 테스트 파일

- [ ] 공용 유틸의 기존 동작을 커버하는 테스트를 새 패키지 위치로 이동하거나 추가한다.
- [ ] `pnpm -r --if-present test`, 각 패키지 `ts-check`, 웹과 앱의 타입 검사를 실행한다.
- [ ] 패키지 경계와 의존성 방향을 `docs/codebase.md`에 기록한다.
- [ ] 변경 파일과 미추적 파일을 검토하고 독립 목적별 커밋으로 나눈다.
