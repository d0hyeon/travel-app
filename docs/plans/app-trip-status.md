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

없다. 2026-08-22 기준 모두 완료.

| 작업 | 상태 | 비고 |
| --- | --- | --- |
| 메모 상세 화면 | 완료 | `cc77f2f`. 목록·고정 목록에서 진입, 수정·삭제 포함 |
| 사진 EXIF 장소 자동 매칭 | 완료 | picker 의 `exif: true` 사용. 웹과 같은 500m 기준 |

## 2단계

플랜: [`docs/plans/app-trip-stage2.md`](./app-trip-stage2.md)

브랜치 3개로 나눈다. 성격은 포팅이며 기능을 누락하거나 다르게 구현하지 않는다.

| 브랜치 | 범위 | 상태 |
| --- | --- | --- |
| `feat/app-photo-exif-place` | 1단계 잔여 (EXIF) | 완료 |
| `feat/app-trip-chat` | trip-chat | 완료 (푸시 알림 제외) |
| `feat/app-trip-rest2` | trip-recommend, trip-community-routes, trip-weather, trip-marine-activity, trip-create, trip-invite, features/weather | 미착수 |

## 채팅 — 푸시 알림 미착수

채팅 본체(목록·전송·읽음·미읽음 배지·활성 방 추적)는 완료했다.
**네이티브 푸시 알림은 붙이지 않았다.**

- 웹은 service worker + 웹푸시(`useWebPushSubscription`)를 쓴다. 앱은 이 경로를 쓸 수 없다.
- 앱에 붙이려면 `expo-notifications` + APNs 설정이 필요하다.
- Personal Team 프로비저닝으로는 `aps-environment` 가 붙지 않아 실기기 검증이 막힌다.
  유료 계정이 있어야 한다.

`ChatPushNoticeCard`(알림 권한 안내 카드)도 같은 이유로 옮기지 않았다.

## 앱 전체에서 영구 제외

statistics, explorer, post + feed, `PlaceDetailPage` 라우트(`/place/:placeId`)

## 확인 방법

실기기 빌드·서명은 `docs/codebase.md` 가 아니라 아래를 따른다.

- 번들 ID `me.waylog.app`, 팀 `JHQ5538PH7`
- Personal Team 은 프로비저닝 프로파일이 7일마다 만료된다. 만료 시 Xcode 에서 재발급
- 코드 수정 후에는 Metro 로그에서 전체 번들 전달(`Bundled ... (N modules)`, N 이 네 자리)과
  `ERROR` 0건을 함께 확인한다. 둘 중 하나만 보면 크래시 상태를 정상으로 오인한다
