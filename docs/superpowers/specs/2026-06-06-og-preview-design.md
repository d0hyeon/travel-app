# OG Preview Card Design

## Overview

여행 채팅과 여행 메모에서 URL이 포함된 콘텐츠를 감지해 Open Graph 미리보기 카드를 표시한다.

**목표:**
- 채팅/메모 내 URL을 클릭 가능한 링크로 렌더링
- 첫 번째 URL에 대해 OG 메타데이터 카드 자동 표시
- Vercel CDN 캐싱으로 반복 요청 비용 절감

---

## Architecture

```
클라이언트 (React Query 캐시 → miss)
  → GET /api/og-preview?url=...
      [Vercel Edge Network — CDN 캐시 1일]
      → Vercel Edge Function (api/og-preview.ts)
          → 대상 URL fetch → HTML <meta og:*> 파싱 → JSON 반환
```

### 캐시 계층

| 계층 | 위치 | TTL | 범위 |
|------|------|-----|------|
| L1 | React Query (메모리) | 세션 내 영구 | 탭 |
| L2 | Vercel CDN | 1일 (86400s) | 글로벌 엣지 |

---

## Components

### 1. Vercel Edge Function (`api/og-preview.ts`)

- **입력:** `?url=` 쿼리파라미터 (URL 인코딩된 대상 URL)
- **처리:** 대상 URL HTML fetch → `<meta property="og:*">` 및 `<meta name="*">` 파싱
- **출력:**
  ```ts
  {
    title: string | null
    description: string | null
    image: string | null
    url: string
    siteName: string | null
  }
  ```
- **응답 헤더:** `Cache-Control: public, s-maxage=86400`
- **실패 처리:** 타임아웃(5s), fetch 오류, 파싱 오류 → 400/500 반환
- **보안:** `url` 파라미터 유효성 검사 (http/https 프로토콜만 허용)

### 2. 클라이언트 훅 (`shared/hooks/useOgPreview.ts`)

```ts
function useOgPreview(url: string | null): OgPreviewData | null
```

- React Query로 `/api/og-preview` 호출
- `staleTime: Infinity` — 세션 내 동일 URL 재호출 없음
- `enabled: !!url` — URL 없으면 호출하지 않음
- 실패 시 `null` 반환 (에러 전파 없음)

### 3. URL 파싱 유틸 (`shared/utils/urls.ts`)

```ts
// 텍스트에서 첫 번째 URL 추출
function extractFirstUrl(text: string): string | null

// 텍스트 내 URL을 <a> 링크로 변환한 ReactNode 반환
function renderTextWithLinks(text: string): ReactNode
```

- URL 정규식: `https?://[^\s]+` 패턴
- `renderTextWithLinks`: URL 부분은 `<a target="_blank" rel="noopener noreferrer">` 로 렌더링

### 4. `OgPreviewCard` 컴포넌트 (`shared/components/OgPreviewCard.tsx`)

**적응형 레이아웃:**
- OG 이미지 있음 → 썸네일 + 제목 + 설명 + 도메인명
- OG 이미지 없음 → 제목 + 도메인명만

**상태:**
- 로딩 중: MUI `Skeleton`
- 데이터 없음 (null): 렌더링하지 않음

**인터랙션:**
- 클릭 시 `target="_blank" rel="noopener noreferrer"` 로 새 탭 열기

**스타일:**
- MUI `Card` 기반, 테두리 스타일 (`variant="outlined"`)
- 썸네일 이미지 최대 높이 120px, `object-fit: cover`

### 5. 적용 대상

**`TripChatMessage.tsx`**
- 기존 `Typography` 텍스트 렌더링 → `renderTextWithLinks()` 로 교체
- 메시지 버블 아래에 `OgPreviewCard` 추가
- `extractFirstUrl(message.content)` 로 URL 추출 후 `useOgPreview` 호출

**`TripMemoDetailPage.tsx`**
- 기존 `Typography` 콘텐츠 렌더링 → `renderTextWithLinks()` 로 교체
- 콘텐츠 아래에 `OgPreviewCard` 추가
- `extractFirstUrl(memo.content)` 로 URL 추출 후 `useOgPreview` 호출

---

## Data Flow

```
메시지/메모 렌더링
  → extractFirstUrl(content)  →  URL 있음?
       ↓ yes                        ↓ no
  useOgPreview(url)            OgPreviewCard 미표시
       ↓
  /api/og-preview?url=...
       ↓
  OgPreviewCard 표시
```

---

## Error Handling

| 상황 | 처리 |
|------|------|
| URL 없음 | OgPreviewCard 미표시 |
| Edge Function 오류 | OgPreviewCard 미표시 (에러 전파 없음) |
| OG 이미지 로드 실패 | 이미지 없는 fallback 레이아웃 표시 |
| 타임아웃 (5s 초과) | 오류로 처리, 카드 미표시 |

---

## File Structure

```
api/
└── og-preview.ts               # Vercel Edge Function (신규)

src/
├── shared/
│   ├── components/
│   │   └── OgPreviewCard.tsx   # OG 카드 컴포넌트 (신규)
│   ├── hooks/
│   │   └── useOgPreview.ts     # React Query 훅 (신규)
│   └── utils/
│       └── urls.ts             # URL 파싱/렌더링 유틸 (신규)
└── features/trip/
    ├── trip-chat/trip-chat-pannel/
    │   └── TripChatMessage.tsx # 수정
    └── trip-memo/
        └── TripMemoDetailPage.tsx # 수정
```
