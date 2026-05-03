# Photo Feed 도입 — 설계 및 구현 계획

## 배경

현재 사진은 단건 단위로 여행에 종속되어 그리드로만 노출된다.
*피드(여러 사진을 묶어 회고/공개)* 기능을 추가하려는데, 토론 중 다음 통찰이 나왔다.

> 여행 *계획*과 *아카이빙·공개*는 목적·감정이 다르다.
> 공개라는 행위는 여행이 아니라 *사용자*의 것이다.

이 통찰을 받아 두 도메인을 분리한다.

| | 여행 안 사진 그리드 | 사용자 피드 (Post) |
|---|--------------------|------------------|
| 주체 | 여행 (멤버 공동) | 사용자 (개인) |
| 목적 | 협업·정리 (도구적) | 회고·공개 (표현적) |
| 위치 | `/trip/:id` 사진 탭 | `/feed`, `/u/:userId` |
| 가시성 | 멤버 전용 | PRIVATE / MEMBERS / PUBLIC |
| 인터랙션 | 없음 | 댓글 + 좋아요 |
| 본 라운드에서 | 변경 없음 | 신규 도입 |

여행 안의 별도 *앨범* 모델은 만들지 않는다 — 현재 그리드 + 장소 필터로 충분.

---

## 모델

### 핵심 원칙

- `photos` 테이블/타입은 **손대지 않는다**. 사진 엔티티는 순수 자원.
- 포스트와 사진의 관계, 그리고 포스트 안의 *순서*는 **포스트 쪽**의 관심사 — `post_photos` join 테이블로.
- 포스트의 위치는 `place_id` XOR `location_id`로 단위가 가변적.
- 가시성은 enum: `PRIVATE` / `MEMBERS` / `PUBLIC`.
- `MEMBERS` 가시성은 `trip_id`가 있을 때만 의미 있음.

### DB 스키마

```sql
-- visibility enum
CREATE TYPE post_visibility AS ENUM ('PRIVATE', 'MEMBERS', 'PUBLIC');

-- 포스트 (사용자 영역)
CREATE TABLE photo_posts (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id         UUID            REFERENCES trips(id) ON DELETE SET NULL,
  title           TEXT,
  description     TEXT,
  cover_photo_id  UUID            REFERENCES photos(id) ON DELETE SET NULL,
  place_id        UUID            REFERENCES places(id) ON DELETE SET NULL,
  location_id     TEXT,                                              -- features/location 의 Location id
  visibility      post_visibility NOT NULL DEFAULT 'PRIVATE',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ,
  CHECK (NOT (place_id IS NOT NULL AND location_id IS NOT NULL)),
  CHECK (visibility <> 'MEMBERS' OR trip_id IS NOT NULL)
);

-- 포스트 ↔ 사진 (관계 + 순서)
CREATE TABLE post_photos (
  post_id        UUID NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  photo_id       UUID NOT NULL REFERENCES photos(id)      ON DELETE CASCADE,
  display_order  INT  NOT NULL,
  PRIMARY KEY (post_id, photo_id)
);

-- 댓글 (DB만, 1차 구현 보류)
CREATE TABLE post_comments (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID         NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  author_id   UUID         NOT NULL REFERENCES auth.users(id),
  content     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- 좋아요
CREATE TABLE post_likes (
  post_id     UUID         NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 인덱스
CREATE INDEX idx_photo_posts_author  ON photo_posts(author_id, created_at DESC);
CREATE INDEX idx_photo_posts_public  ON photo_posts(created_at DESC) WHERE visibility = 'PUBLIC';
CREATE INDEX idx_photo_posts_trip    ON photo_posts(trip_id, created_at DESC);
CREATE INDEX idx_post_photos_post    ON post_photos(post_id, display_order);
CREATE INDEX idx_post_photos_photo   ON post_photos(photo_id);
CREATE INDEX idx_post_comments_post  ON post_comments(post_id, created_at DESC);
```

### RLS 요지

- `photo_posts SELECT` — `visibility = 'PUBLIC' OR author_id = auth.uid() OR (visibility = 'MEMBERS' AND can_access_trip(trip_id))`
- `photo_posts INSERT` — `author_id = auth.uid()`
- `photo_posts UPDATE/DELETE` — `author_id = auth.uid()`
- `post_photos` — 부모 포스트 권한과 동일
- `post_likes` — 본인 row만 INSERT/DELETE, SELECT는 포스트 가시성 따름
- `post_comments` — 1차 보류이지만 SELECT/INSERT는 포스트 가시성 + 작성자만 UPDATE/DELETE

---

## 도메인 타입

```ts
// features/photo — Photo는 손대지 않음

// features/post/post.types.ts
export type PostVisibility = 'PRIVATE' | 'MEMBERS' | 'PUBLIC'

export type PostScope =
  | { kind: 'PLACE';    placeId: string }
  | { kind: 'LOCATION'; locationId: string }

export interface PhotoPost {
  id: string
  authorId: string
  tripId: string | null
  title: string | null
  description: string | null
  coverPhotoId: string | null
  scope: PostScope | null
  visibility: PostVisibility
  photoIds: string[]                    // post_photos를 display_order 정렬해 채움
  createdAt: string
  updatedAt: string | null
}

export interface PostComment {           // 타입까지만, UI 보류
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string | null
}
```

---

## 디렉토리 구조

```
src/
├── app/routes.ts                              ← /feed, /u/:userId, /post/new, /post/:postId 추가
│
├── features/
│   ├── photo/                                 ← 변경 없음
│   │   ├── photo.api.ts
│   │   ├── photo.types.ts
│   │   └── photo.utils.ts                     ← matchPlaceByCoordinate 추가
│   │
│   └── post/                                  ← NEW
│       ├── post.api.ts
│       ├── post.types.ts
│       ├── post.utils.ts                      ← suggestScope
│       ├── usePost.ts / usePosts.ts
│       ├── useUserFeed.ts / usePublicFeed.ts
│       ├── usePostLikes.ts
│       ├── FeedPage.tsx                       ← /feed
│       ├── UserFeedPage.tsx                   ← /u/:userId
│       ├── PostDetailPage.tsx                 ← /post/:postId
│       ├── PostFeed.tsx
│       ├── PostCard.tsx
│       ├── PostDetail.tsx
│       ├── PostLikeButton.tsx
│       └── post-form/                         ← 퍼널 (/post/new)
│           ├── PostFormPage.tsx
│           ├── TripStep.tsx
│           ├── PhotoStep.tsx
│           ├── MetaStep.tsx
│           ├── PostScopeField.tsx
│           ├── PostVisibilityField.tsx
│           ├── PostTitleField.tsx
│           └── PostDescriptionField.tsx
│
└── shared/utils/
    └── exif.ts                                ← extractGps(file)
```

### 모듈 책임

- `shared/utils/exif.ts` — 도메인 무관, 파일에서 좌표만 추출 (`extractGps`)
- `features/photo/photo.utils.ts` — 기존 `findNearestPlaceFromPhoto`가 `extractGps`를 사용하도록 리팩터링 (단건 업로드에 이미 적용됨)
- `features/post/post.utils.ts` — 사진들의 placeId로 포스트 scope 추론 (`suggestScope`)
- `features/post/post.api.ts` — 포스트 + post_photos 묶음 처리 (트랜잭션처럼)

---

## 작성 플로우

```
/post/new (PostFormPage 퍼널)
    ↓
TripStep        — 여행 셀렉트 (없음 가능)
    ↓
PhotoStep       — 여행 선택 시: 그 여행 사진 다중 선택 + 새 업로드
                  여행 미선택: 새 업로드만
                  새 업로드 시 EXIF 추출 → placeId 자동 매칭
    ↓
MetaStep        — 가시성, 제목, 캡션, 위치(scope), 커버
                  (자동 추천: suggestScope 결과를 기본값으로)
    ↓
[제출] → photo_posts INSERT + post_photos INSERT (트랜잭션처럼)
       → /post/:postId
```

---

## 구현 순서 / 진행 마킹

각 단계는 별도 커밋. 커밋 메시지 prefix: `feat`, `refactor`, `chore` 등 역할 단위.

- [x] **1. 계획서 작성** — `docs/photo-feed-redesign.md` (이 문서)
- [x] **2. DB 마이그레이션 SQL** — `migration.feed.sql` 작성
  - enum, photo_posts, post_photos, post_comments, post_likes, RLS
  - schema.sql 갱신
- [x] **3. `_database.types.ts` 동기화** — Supabase CLI 없이 수동 추가
- [x] **4. EXIF 유틸** — `shared/utils/exif.ts` 분리, 기존 `findNearestPlaceFromPhoto`가 사용
  - exifr는 이미 설치되어 있고 단건 업로드에 적용됨 (`useTripPhotos`)
- [x] **5. post 데이터 레이어** — types, utils, api, hooks
  - 1차 `suggestScope`는 모든 사진의 placeId가 동일할 때만 PLACE 추천. LOCATION 자동 추론은 다음 단계.
- [x] **6. post-form 퍼널** — PostFormPage + Steps + Fields
  - 1차에서 trip 선택은 필수 (photos 테이블이 trip_id NOT NULL이라 새 업로드도 trip 필요).
  - trip nullable 흐름은 사진 소유권 모델 변경 후 다음 단계.
- [x] **7. post UI 컴포넌트** — PostCard, PostFeed, PostDetail, PostLikeButton + 페이지들
  - PhotoPost.photoIds → photos: Photo[] 로 변경 (cover 등 url 노출을 위해 join 결과 그대로 도메인에 포함)
- [x] **8. 라우트 등록** — `/feed`, `/u/:userId`, `/post/new`, `/post/:postId`
  - 미래 제거 시 routes.ts의 4줄 + features/post 폴더만 삭제 가능하도록 주석 마커 추가
  - `/post/new?tripId=xxx`로 진입 시 photo 단계부터 시작
- [x] **9. TripPhotoContent 진입점** — `CreatePostEntry` 컴포넌트로 분리해 mobile/desktop에 추가
  - 미래 제거 시 import 1줄 + 사용 1줄 = 각 파일 2줄

### 1차에서 제외 (다음 단계)

- 댓글 UI / `usePostComments` 훅 / `PostComments` 컴포넌트
  → DB 테이블·타입까지만 확보
- 단건 `PhotoUploader`에 EXIF placeId 자동 채움 (선택, 별도 PR)
- 통합 피드의 소셜 정책 확장 (팔로우 등)
- Region 단위 scope (필요해지면 동일 패턴으로 추가)
- 포스트 수정 (작성만 1차)
