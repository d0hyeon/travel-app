# Waylog 공용 패키지 분리 설계

## 목표

여러 앱과 `@waylog/domains`에 흩어진 플랫폼 비의존 유틸리티와 공용 타입을 `@waylog/utility`로 통합한다.

## 경계

- `@waylog/utility`: 브라우저/React/도메인 API에 의존하지 않는 런타임 함수와 공용 타입. 현재 `packages/domains/src/utils`의 `common`, `coordinate`, `formats`, `geo`, `urls`, 타입 헬퍼를 이동한다.
- `mergeQueries*`는 TanStack Query 타입에 결합되어 있으므로 이번 공용 패키지로 옮기지 않고 `@waylog/domains`에 남긴다.
- 도메인 의미가 있는 `*.types.ts`, `*.utils.ts`, 앱의 UI/지도/사진 전용 타입과 함수는 각 소유 패키지에 남긴다.

## 의존성 방향

`@waylog/domains` → `@waylog/utility`; 앱 → 필요한 공용 패키지와 domains. 새 패키지는 React, DOM, Supabase, TanStack Query를 의존하지 않는다.

## 호환성

기존 `@waylog/domains/utils` export는 제거하고 모든 사용처를 명시적인 `@waylog/utility` import로 전환한다. 패키지별 `exports`는 루트 진입점과 하위 모듈 진입점을 제공한다.

## 검증

공용 패키지 단위 타입 검사와 테스트, `@waylog/domains` 테스트/타입 검사, 웹·앱 타입 검사를 실행하고 레거시 `@waylog/domains/utils` 참조가 없는지 검색한다.
