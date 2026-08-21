# 앱 trip 이관 현황

`apps/waylog-app` 이 웹(`apps/waylog-web`)을 얼마나 따라왔는지 기록한다.
기준은 언제나 웹이다 — 네이티브 제약으로 웹 스펙을 지키지 못하면
임의로 대체하지 말고 보고한다.

작성 시점: 2026-08-21

## 완료

| 영역 | 비고 |
| --- | --- |
| 로그인 / 여행 목록 / 여행 상세 셸 | 탭 5개 (정보·장소·계획·정산·사진) |
| trip-basic-info | |
| trip-place | 지도·클러스터·바텀시트 |
| trip-route | 드래그 정렬, 일자별 경로 |
| trip-expense | |
| trip-checklist | |
| trip-memo | 목록까지 |
| trip-photo | |
| trip-member | |
| 지도 | `react-native-maps` (Google 단일). 장소검색·도로경로만 국내외 분기 |
| 바텀시트 | 자체 구현. 스냅·스크롤·키보드 대응 |

## 1단계 잔여

| 작업 | 상태 | 비고 |
| --- | --- | --- |
| 메모 상세 화면 | 미착수 | 목록만 있고 상세 진입이 없다 |
| 사진 EXIF 장소 자동 매칭 | 미착수 | 웹 `trip-photo` 참조 |

## 2단계

trip-create, trip-invite,
trip-recommend, trip-community-routes, trip-weather,
trip-marine-activity, trip-chat, features/weather

## 앱 전체에서 영구 제외

statistics, explorer, post + feed, `PlaceDetailPage` 라우트(`/place/:placeId`)

## 확인 방법

실기기 빌드·서명은 `docs/codebase.md` 가 아니라 아래를 따른다.

- 번들 ID `me.waylog.app`, 팀 `JHQ5538PH7`
- Personal Team 은 프로비저닝 프로파일이 7일마다 만료된다. 만료 시 Xcode 에서 재발급
- 코드 수정 후에는 Metro 로그에서 전체 번들 전달(`Bundled ... (N modules)`, N 이 네 자리)과
  `ERROR` 0건을 함께 확인한다. 둘 중 하나만 보면 크래시 상태를 정상으로 오인한다
