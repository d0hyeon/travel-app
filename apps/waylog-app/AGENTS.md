# waylog-app (Expo)

Expo SDK 54 / React Native 0.81.

Expo Go 는 개발 편의 도구일 뿐이다. SDK 버전이나 네이티브 모듈 선택의
근거로 삼지 않는다. 네이티브 모듈이 필요하면 development build 로 간다.

API가 버전마다 크게 바뀐다. 코드를 쓰기 전에 해당 버전 문서를 확인한다:
https://docs.expo.dev/versions/v54.0.0/

## 개발 구동

네이티브 development build 를 쓴다. Expo Go 는 react-native-maps 같은
네이티브 모듈을 싣지 못한다.

```bash
npx expo run:ios      # 최초 1회 (네이티브 빌드)
npx expo start --dev-client   # 이후 개발 (Fast Refresh 동작)
```

네이티브 의존성을 추가했을 때만 다시 빌드하면 된다.
`.env` 는 gitignore 대상이라 워크트리마다 복사해야 한다.

## 스택

- 라우팅: Expo Router (파일 기반, `app/`)
- 스타일: `@emotion/native`. 토큰은 `src/shared/config/tokens.ts` (웹 `theme.ts` 값 승계)
- 화면은 **웹 `.mobile.tsx` 를 그대로 복사한 뒤 컴포넌트만 치환**한다.
  `src/shared/components/mui` 가 MUI 와 같은 이름·prop 을 제공하므로
  import 경로와 축약 prop 만 바꾸면 로직은 손대지 않는다.
- 복잡한 동작은 헤드리스 라이브러리를 쓴다 (예: 캘린더 → `@h6s/calendar`)

컴포넌트는 미리 만들지 않는다. 실제로 쓰이는 것만, 필요한 variation 만 둔다.

레포 전역 규칙은 루트 `CLAUDE.md`를 따른다.
