# Bookmark Feature Design

**Goal:** 로그인 사용자가 Explorer와 PlaceDetailPage에서 장소를 즐겨찾기하고, UserProfilePage에서 목록을 조회한다.

**Storage:** IndexedDB (schema-idb), 기기 로컬 저장, 서버 불필요

---

## 요구사항

- Explorer detail 오버레이에서 북마크 추가/제거
- PlaceDetailPage(`/place/:placeId`)에서 북마크 추가/제거
- UserProfilePage에서 북마크한 장소 목록 조회 (본인만 열람 가능)
- 제한 없음, 기기 간 동기화 없음

---

## 아키텍처

### 공용 DB 이전

기존 `src/features/route/road-route/client-database.ts`를 `src/app/client-database.ts`로 이동한다. road-route는 이를 re-export로 교체한다. 이후 모든 IndexedDB store는 이 단일 인스턴스에 추가한다.

### 파일 구조

| 파일 | 역할 |
|------|------|
| `src/app/client-database.ts` | `travel-app` DB 인스턴스 (roadRouteSchema + bookmarkSchema) |
| `src/features/route/road-route/client-database.ts` | `app/client-database` re-export |
| `src/features/place/bookmark.schema.ts` | bookmarks store 스키마 정의 |
| `src/features/place/useBookmark.ts` | 단일 장소 북마크 상태 + 토글 |
| `src/features/place/useBookmarks.ts` | 전체 북마크 목록 조회 |

### 스키마

```ts
defineStore('bookmarks', {
  placeId: field.string().primaryKey(),
  savedAt: field.number(), // Date.now()
})
```

### 훅 인터페이스

```ts
// useBookmark.ts
function useBookmark(placeId: string): {
  isBookmarked: boolean
  toggle: () => Promise<void>
}

// useBookmarks.ts
function useBookmarks(): {
  bookmarks: { placeId: string; savedAt: number }[]
}
```

---

## UI 통합

- **Explorer detail 오버레이** — 북마크 아이콘 버튼, `useBookmark(placeId)` 연결
- **PlaceDetailPage** — 북마크 아이콘 버튼, `useBookmark(placeId)` 연결
- **UserProfilePage** — 북마크 탭 추가, `useBookmarks()` 로 목록 렌더

---

## 데이터 흐름

```
toggle() 호출
  └─ isBookmarked === true  → clientDatabase.bookmarks.delete(placeId)
  └─ isBookmarked === false → clientDatabase.bookmarks.add({ placeId, savedAt })
  └─ 상태 갱신 (React Query invalidate 또는 로컬 state)
```
