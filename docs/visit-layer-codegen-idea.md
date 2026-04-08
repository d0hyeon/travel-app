# Visit Layer Codegen Idea

## Why

지도 방문 레이어와 통계 쪽에는 수동 상수가 점점 늘어나는 경향이 있다.

- `DESTINATION_TO_COUNTRY`
- `COUNTRY_TO_ISO3`
- `REGION_BY_DESTINATION`
- 국가/행정구역 GeoJSON 파일

이 구조는 처음에는 빠르지만, 여행지가 늘수록 아래 문제가 생긴다.

- 목적지 문자열 추가 시 여러 파일을 함께 수정해야 한다.
- 수동 매핑 누락이나 오타가 생기기 쉽다.
- 실제로 쓰지 않는 국가/지역 자산까지 함께 관리하게 된다.
- 상수와 실제 DB 데이터가 서서히 어긋날 수 있다.

## Idea

수동 상수 중심 구조를 일부 코드젠 구조로 옮긴다.

핵심 아이디어:

1. API 또는 DB에서 전체 여행 목적지 목록을 조회한다.
2. 목적지 목록을 정규화한다.
3. 정규화된 결과를 바탕으로 필요한 메타데이터 파일을 생성한다.
4. 실제로 사용된 국가에 대해서만 GeoJSON 자산을 생성 또는 복사한다.

즉, "앱에 등장한 여행 지역만 기준으로 상수와 지도 자산을 만든다"는 방향이다.

## Expected Flow

예상 생성 흐름:

1. `trips` 또는 통합된 location source 에서 전체 destination 목록 조회
2. destination 문자열 정규화
3. destination -> country / region / iso3 메타 생성
4. 사용된 country 목록 추출
5. 사용된 country 에 해당하는 ADM1 GeoJSON만 수집
6. 앱에서 읽기 쉬운 generated 파일 출력

예상 출력물:

- `src/features/map/visitLayer/generated/destinationMeta.ts`
- `src/features/statistics/generated/regionMeta.ts`
- `public/visit-layer/generated/world.geojson`
- `public/visit-layer/generated/adm1/{ISO3}.geojson`

## Suggested Script Shape

예시 스크립트 이름:

- `scripts/generate-visit-layer.ts`

예시 명령:

```bash
npm run generate:visit-layer
```

할 일 예시:

- destination 목록 조회
- destination alias 정규화
- country / region / iso3 매핑 생성
- 필요한 GeoJSON 다운로드 또는 로컬 소스에서 복사
- generated 파일 기록

## Runtime vs Build Time

권장 방식은 런타임 조회보다 빌드 전 생성이다.

이유:

- 브라우저에서 외부 지리 데이터 소스를 직접 호출하지 않아도 된다.
- CORS 이슈를 피하기 쉽다.
- 지도에서 필요한 자산만 정적으로 서빙할 수 있다.
- 디버깅과 캐싱이 단순해진다.

## Benefits

- 수동 상수 유지보수량 감소
- 실제 사용 데이터 기준으로 자산 최소화
- 새 여행지 추가 시 코드 수정 없이 재생성만으로 반영 가능
- 지도/통계에서 같은 메타데이터를 공유 가능
- 사람이 직접 맞추는 매핑보다 일관성이 높아짐

## Risks

- destination 문자열 품질이 들쭉날쭉하면 완전 자동화가 어렵다.
- 외부 지리 데이터 소스의 품질이 국가별로 다를 수 있다.
- 일부 목적지는 자동 매핑이 애매할 수 있다.
- 결국 일정량의 manual override 테이블은 남을 가능성이 높다.

## Practical Recommendation

완전 자동화보다 아래 형태가 현실적이다.

1. 기본은 코드젠
2. 애매한 목적지는 `overrides` 파일로 보정
3. generated 파일만 앱 코드가 사용

예시:

- `scripts/visit-layer/overrides.ts`
- `scripts/visit-layer/normalizeDestination.ts`
- `src/features/map/visitLayer/generated/destinationMeta.ts`

## Next Step If We Do This Later

나중에 실제로 구현한다면 순서는 이 정도가 적당하다.

1. 현재 수동 상수의 실제 사용처 정리
2. 생성 대상 스키마 정의
3. destination 정규화 규칙 정의
4. 간단한 codegen script 작성
5. 수동 상수 일부를 generated 파일로 교체
6. 마지막에 GeoJSON 자산 생성까지 연결

## Note

지금은 아이디어 기록만 남긴 상태다.
실제 구현은 아직 하지 않았고, 필요할 때 작은 범위부터 점진적으로 도입하는 편이 안전하다.
