# waylog-app (Expo)

Expo SDK 54 / React Native 0.81.

Expo Go 는 개발 편의 도구일 뿐이다. SDK 버전이나 네이티브 모듈 선택의
근거로 삼지 않는다. 네이티브 모듈이 필요하면 development build 로 간다.

API가 버전마다 크게 바뀐다. 코드를 쓰기 전에 해당 버전 문서를 확인한다:
https://docs.expo.dev/versions/v54.0.0/

## 스택

- 라우팅: Expo Router (파일 기반, `app/`)
- 스타일: `@emotion/native` 자체 구축. 공용 컴포넌트는 `src/shared/components`,
  토큰은 `src/shared/config/tokens.ts` (웹 `theme.ts` 에서 값만 승계)
- 복잡한 동작은 헤드리스 라이브러리를 쓴다 (예: 캘린더 → `@h6s/calendar`)

컴포넌트는 미리 만들지 않는다. 실제로 쓰이는 것만, 필요한 variation 만 둔다.

레포 전역 규칙은 루트 `CLAUDE.md`를 따른다.
