# Travel App

여행 계획 및 정산 관리 앱.

## 개발 명령어

```bash
yarn dev          # 개발 서버
yarn build        # 프로덕션 빌드
yarn ts-check     # 타입 검사
yarn lint         # ESLint
yarn gen-types    # Supabase DB 타입 재생성
```

## 환경 변수

- `VITE_DATA_GO_SERVICE_KEY`: 공공데이터포털 API 키

## 해양 활동 지수

- 지원 API: 해수욕지수, 스킨스쿠버지수
- 노출 위치: 여행 계획 탭의 날짜 선택 영역 아래
- 노출 조건: 국내 섬/해안 여행일 때만 표시
- 조회 가능 범위: 오늘부터 3일 뒤까지
- 운영 메모: KHOA가 `placeCode`를 바꾸면 `src/features/marine-activity/marineActivityPlaces.ts` 카탈로그도 함께 갱신해야 한다
