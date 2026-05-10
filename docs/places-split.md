# places 분리 — 호환 마이그레이션 계획

## 배경

현재 `places` 테이블이 `trip_id`에 종속되어 있어, 동일한 실제 장소(예: 도쿄 타워)가 여행마다 별도 row로 생성된다.

향후 *전역 장소 단위 데이터 집약* (장소 페이지 / 추천 피드 / 여행 무관 포스트 / 사용자 간 같은 장소 인식)을 위해 다음으로 분리:

- **`places`** — 전역 장소 (POI 자체)
- **`trip_places`** — 여행-장소 연결 (trip 컨텍스트의 메타: 상태·메모·카테고리·태그)

---

## 데이터 매핑 전략 — *옵션 1* (legacy 통째)

기존 `places` 데이터를 좌표 기반 dedup 없이 *그대로* 새 모델로 옮긴다.

- 기존 `places.id` → 새 `places.id` 그대로 재사용 (우선 PR2에서 적용)
- 기존 `places.id` → 새 `trip_places.id`로도 재사용
- 새 `places.provider = 'legacy'`, `external_id = id::text` (UNIQUE 충족용 임시값)

**왜 dedup 안 하나** — 좌표/이름 휴리스틱은 잘못 매칭되면 사용자 데이터를 *섞는* 비가역적 사고가 된다. 진짜 *전역* 의미는 사용자가 **신규 등록**(카카오/구글 검색)부터 자연스럽게 형성되도록 두고, legacy → 진짜 reconcile은 별도 후속 작업.

**uuid 변경 0** — `expenses.place_id`, `routes.place_ids[]`, `photos.place_id`, `photo_posts.place_id`의 값은 그대로. constraint 의미만 갱신.

---

## 배포 전략 — *호환 2단계*

데이터가 많아 한 번에 마이그레이션 + 코드 전환을 묶으면 위험. 두 PR로 분리:

### PR 1 — 데이터 복사만 (옛 places 그대로)

- 새 `trip_places` 테이블 추가
- 기존 `places`의 데이터를 `trip_places`로 복사 (id 재사용)
- **옛 `places` 컬럼은 변경 없음** — `trip_id`, `status`, `memo`, `category`, `tags` 그대로 살아있음
- 코드는 `from('places').eq('trip_id', ...)` 그대로 동작 → **앱 영향 0**
- 새 `trip_places`는 *아직 누구도 안 봄*

→ 운영에 영향 없이 데이터 복사만. 문제 시 `trip_places` DROP만으로 롤백.

### PR 2 — 옛 컬럼 정리 + 코드 전환 (한 번에 배포)

- `places`에 `provider`, `external_id` 컬럼 추가 (legacy 값 채움)
- `places`에서 trip-scoped 컬럼 DROP: `trip_id`, `status`, `memo`, `category`, `tags`
- `expenses.place_id` FK → `trip_places(id)` 변경
- `photos.place_id`, `photo_posts.place_id` → 새 places(전역) 가리킴 (값은 그대로)
- 코드 전환:
  - `place.types.ts` 분리 (`Place` 전역 / `TripPlace` trip-scoped)
  - `place.api.ts` — `upsertPlace(provider, external_id)`, `trip_places` CRUD
  - `useTripPlaces` 등 hook 전환 (호출부 인터페이스는 유지하되 내부 join)
  - `place-search/`가 검색 결과를 places upsert로 처리
- 마이그레이션 SQL과 코드 배포가 *한 번에* 적용되어야 안전

---

## 체크리스트

### PR 1
- [ ] `docs/places-split.md` 계획서
- [ ] `migration.places-split.phase1.sql`
- [ ] `schema.sql`에 `trip_places` 추가
- [ ] `_database.types.ts`에 `trip_places` Row/Insert/Update 추가
- [ ] PR 1 머지·배포 후 `trip_places` 데이터가 places와 1:1 매칭되는지 검증

### PR 2 (별도 PR)
- [ ] `migration.places-split.phase2.sql` (places 컬럼 정리, FK 변경, provider/external_id 추가)
- [ ] `place.types.ts` 분리
- [ ] `place.api.ts` 정리 (`upsertPlace`, trip_places CRUD)
- [ ] `useTripPlaces` 등 hook 전환
- [ ] `place-search/`가 places upsert 사용
- [ ] expense/route/photo의 place_id 의미 검증
- [ ] 컴파일 + 동작 검증

---

## 후속 (이번 작업 범위 밖)

- **legacy → 진짜 places reconcile** — 사용자가 카카오/구글 검색으로 등록 시 좌표 근접한 legacy place 자동 매칭 제안
- **장소 페이지** `/place/:id` — 사진/포스트 전역 모음
- **여행 무관 포스트** — `photo_posts.trip_id` nullable 흐름 (이전 라운드 합의된 옵션 C)
