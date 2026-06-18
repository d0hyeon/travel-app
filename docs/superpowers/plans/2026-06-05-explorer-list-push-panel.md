# Explorer 리스트 뷰 Push 사이드 패널 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크탑 탐색 페이지 리스트 뷰에서 장소를 클릭하면 사이드 패널이 오버레이가 아닌 콘텐츠를 밀어내는 방식으로 열린다. 지도 뷰는 기존 오버레이 방식을 유지한다.

**Architecture:** 도메인 상태(어떤 장소)와 UI 상태(패널 열림)를 분리한다. `createContextState<T>`라는 범용 Context 상태 팩토리를 `shared`에 추가하고, `explorerDetail.types.ts`에서 `PlaceRef` 타입과 도메인 훅(`useExplorerPlace`, `useSetExplorerPlace`, `ExplorerPlaceProvider`)으로 추상화해 export한다. 각 섹션은 `useSetExplorerPlace()`로 장소를 set하고, `PlaceExplorerDetailSidePanel`은 `place`와 `onClose`를 prop으로 받아 Context를 모른다. `ExplorerContent`가 Context를 읽어 패널에 주입한다. 레이아웃은 flex row로 패널을 형제로 배치해 콘텐츠를 밀어낸다.

**Tech Stack:** React Context, MUI Drawer (variant="persistent"), TypeScript generics

---

## File Structure

| 파일 | 변경 |
|------|------|
| `src/shared/hooks/createContextState.tsx` | 신규 — 범용 Context 상태 팩토리 |
| `src/features/explorer/explorer-detail/explorerDetail.types.ts` | 신규 — `PlaceRef` 타입 + 도메인 훅 (`useExplorerPlace`, `useSetExplorerPlace`, `ExplorerPlaceProvider`) |
| `src/features/explorer/PlaceExplorerPage.desktop.tsx` | 수정 — Provider + flex row 레이아웃, Context 읽어 패널에 주입 |
| `src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx` | 수정 — `placeId`/`onClose` prop 주입, Context 의존 제거, Drawer → persistent |
| `src/features/explorer/explorer-recent/RecentHotSection.tsx` | 수정 — 데스크탑 리스트 뷰에서 `useSetExplorerPlace` 사용 |
| `src/features/explorer/explorer-saved/MostSavedSection.tsx` | 수정 — 데스크탑 리스트 뷰에서 `useSetExplorerPlace` 사용 |
| `src/features/explorer/explorer-ranking/TopVisitedSection.tsx` | 수정 — 데스크탑 리스트 뷰에서 `useSetExplorerPlace` 사용 |

---

## Task 1: `createContextState` 범용 팩토리 작성

**Files:**
- Create: `src/shared/hooks/createContextState.tsx`

- [ ] **Step 1: 파일 작성**

```tsx
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export function createContextState<T>() {
  const ValueContext = createContext<T | null>(null)
  const SetValueContext = createContext<(value: T | null) => void>(() => {})

  function Provider({ children }: { children: ReactNode }) {
    const [value, setValue] = useState<T | null>(null)
    return (
      <ValueContext.Provider value={value}>
        <SetValueContext.Provider value={setValue}>
          {children}
        </SetValueContext.Provider>
      </ValueContext.Provider>
    )
  }

  function useValue() {
    return useContext(ValueContext)
  }

  function useSetValue() {
    return useContext(SetValueContext)
  }

  return { Provider, useValue, useSetValue }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc -b --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/shared/hooks/createContextState.tsx
git commit -m "feat: createContextState 범용 Context 상태 팩토리 추가"
```

---

## Task 2: `explorerDetail.types.ts` — 타입 + 도메인 훅 정의

`PlaceRef` 타입과 Context를 내부 구현으로 숨기고, 도메인 훅만 export한다.
소비자는 Context 인스턴스를 직접 알지 못한다.

**Files:**
- Create: `src/features/explorer/explorer-detail/explorerDetail.types.ts`

- [ ] **Step 1: 파일 작성**

```ts
import { createContextState } from '~shared/hooks/createContextState'
import type { ReactNode } from 'react'

export type PlaceRef = { placeId: string; name: string }

const ExplorerPlaceContext = createContextState<PlaceRef>()

export function ExplorerPlaceProvider({ children }: { children: ReactNode }) {
  return <ExplorerPlaceContext.Provider>{children}</ExplorerPlaceContext.Provider>
}

export const useExplorerPlace = ExplorerPlaceContext.useValue
export const useSetExplorerPlace = ExplorerPlaceContext.useSetValue
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc -b --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/explorer/explorer-detail/explorerDetail.types.ts
git commit -m "feat: ExplorerPlaceContext 및 PlaceRef 타입 분리"
```

---

## Task 3: `PlaceExplorerPageDesktop` — Provider + flex 레이아웃

**Files:**
- Modify: `src/features/explorer/PlaceExplorerPage.desktop.tsx`

- [ ] **Step 1: 파일 전체 교체**

```tsx
import { Box, Container, Stack, Typography } from '@mui/material'
import { Suspense, useEffect, useRef } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { SwitchCase } from '~shared/components/SwitchCase'
import { ExplorerFilters } from './explorer-filters/ExplorerFilters.desktop'
import { ExplorerViewToggleButton, useExplorerViewMode } from './explorer-view/ExplorerViewToggleButton'
import { ExplorerCatalog } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'
import { PlaceExplorerDetailSidePanel } from './explorer-detail/PlaceExplorerDetailSidePanel'
import { ExplorerPlaceProvider, useExplorerPlace, useSetExplorerPlace } from './explorer-detail/explorerDetail.types'

export function PlaceExplorerPageDesktop() {
  return (
    <ExplorerPlaceProvider>
      <ExplorerContent />
    </ExplorerPlaceProvider>
  )
}

function ExplorerContent() {
  const [viewMode, setViewMode] = useExplorerViewMode()
  const titleRef = useRef(null)
  const place = useExplorerPlace()
  const setPlace = useSetExplorerPlace()

  useEffect(() => {
    if (viewMode !== 'list') setPlace(null)
  }, [viewMode])

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        leftElement={null}
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 0, paddingBottom: 0 }}
      >
        <Typography ref={titleRef} variant="subtitle1" fontWeight={600}>탐색</Typography>
      </TopNavigation>

      <Stack direction="row" gap={1} alignItems="center" px={2} py={1} borderBottom={1} borderColor="divider" flexShrink={0}>
        <Suspense>
          <ExplorerFilters.LocationChip />
          <ExplorerFilters.CategoryChip />
        </Suspense>
      </Stack>

      <Box flex={1} overflow="hidden" display="flex" flexDirection="row">
        <Box flex={1} overflow="auto" sx={{ overscrollBehaviorY: 'none' }}>
          <Suspense>
            <SwitchCase
              value={viewMode}
              cases={{
                map: () => <ExplorerMap height="100%" />,
                list: () => (
                  <Container>
                    <ExplorerCatalog />
                  </Container>
                ),
              }}
            />
          </Suspense>
        </Box>

        {viewMode === 'list' && place && (
          <PlaceExplorerDetailSidePanel
            placeId={place.placeId}
            onClose={() => setPlace(null)}
          />
        )}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc -b --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/explorer/PlaceExplorerPage.desktop.tsx
git commit -m "feat: 탐색 데스크탑 페이지 Provider + flex 레이아웃 적용"
```

---

## Task 4: `PlaceExplorerDetailSidePanel` — Context 소비 + persistent Drawer

**Files:**
- Modify: `src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx`

- [ ] **Step 1: 파일 전체 교체**

```tsx
import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  ImageList,
  ImageListItem,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { Suspense, useState } from 'react'
import { usePlace } from '~features/place/usePlace'
import { usePlaceFeed } from '~features/post/place-feed/usePlaceFeed'
import { PostCard } from '~features/post/PostCard'
import { Map } from '~shared/components/Map'
import { PhotoDialog } from '~shared/components/photo/PhotoDialog'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useOverlay } from '~shared/hooks/useOverlay'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { usePlacePhotos } from '../../place/usePlacePhotos'
interface Props {
  placeId: string
  onClose: () => void
}

export function PlaceExplorerDetailSidePanel({ placeId, onClose }: Props) {
  const [currentTab, changeTab] = useState<'basic' | 'feed'>('basic')

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open
      onClose={onClose}
      sx={{ flexShrink: 0 }}
      PaperProps={{
        sx: {
          position: 'relative',
          width: 480,
          maxWidth: 'calc(100vw - 72px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
        >
          <PlaceName placeId={placeId} />
          <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Tabs
          variant="fullWidth"
          value={currentTab}
          onChange={(_, value) => changeTab(value)}
          sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
        >
          <Tab label="기본정보" value="basic" />
          <Tab label="피드" value="feed" />
        </Tabs>

        <Box flex={1} overflow="auto">
          <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress size={24} /></Box>}>
            <SwitchCase
              value={currentTab}
              cases={{
                basic: <PlaceBasicInfo placeId={placeId} />,
                feed: () => <PlaceFeed placeId={placeId} />,
              }}
            />
          </Suspense>
        </Box>
      </>
      )}
    </Drawer>
  )
}

function PlaceFeed({ placeId }: { placeId: string }) {
  const { data: { feed } } = usePlaceFeed(placeId)

  if (feed.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" marginTop={5} textAlign="center">
        작성된 피드가 없어요
      </Typography>
    )
  }

  return (
    <Stack gap={1} p={2}>
      {feed.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </Stack>
  )
}

function PlaceBasicInfo({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId)
  const { data: photos } = usePlacePhotos(placeId)
  const overlay = useOverlay()

  return (
    <Stack gap={2} p={2}>
      <Map
        type={isOverseasByCoordinate(place.lat, place.lng) ? 'google' : 'kakao'}
        height={300}
        center={place}
      >
        <Map.Marker {...place} label={place.name} variant="pin" />
      </Map>

      {place.address && (
        <Stack direction="row" alignItems="center" gap={0.25}>
          <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">{place.address}</Typography>
        </Stack>
      )}

      {photos.length !== 0 && (
        <ImageList cols={2} gap={6} sx={{ mt: 2 }}>
          {photos.map((photo, idx) => (
            <ImageListItem
              key={photo.id}
              sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => {
                overlay.open(({ isOpen, close }) => (
                  <PhotoDialog open={isOpen} onClose={close} photos={photos} initialIndex={idx} />
                ))
              }}
            >
              <img src={photo.url} alt="" loading="lazy" style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }} />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc -b --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx
git commit -m "feat: 탐색 사이드 패널 Context 소비 및 persistent Drawer 적용"
```

---

## Task 5: 각 섹션에서 데스크탑 클릭 시 Context setValue 사용

**Files:**
- Modify: `src/features/explorer/explorer-recent/RecentHotSection.tsx`
- Modify: `src/features/explorer/explorer-saved/MostSavedSection.tsx`
- Modify: `src/features/explorer/explorer-ranking/TopVisitedSection.tsx`

현재 각 섹션은 `useExplorerDetailOverlay`에서 `openSideSheet`를 호출한다. 데스크탑 리스트 뷰에서는 Context의 `setValue`를 대신 사용한다. 지도 뷰와 모바일은 기존 그대로 유지한다.

- [ ] **Step 1: `RecentHotSection.tsx` 수정**

`openSideSheet` 호출 부분을 아래로 교체:

```tsx
import { useSetExplorerPlace } from '../explorer-detail/explorerDetail.types'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'

// 컴포넌트 내부
const isMobile = useIsMobile()
const [viewMode] = useExplorerViewMode()
const setExplorerPlace = useSetExplorerPlace()
const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()

const openDetail = (place: ExploredPlace) => {
  if (isMobile) return openFullScreen(place)
  if (viewMode === 'list') return setExplorerPlace(place)
  openSideSheet(place)
}
```

`PlaceCard`의 `onClick`은 `() => openDetail(place)` 그대로 유지.

- [ ] **Step 2: `MostSavedSection.tsx` 수정**

동일 패턴 적용:

```tsx
import { useSetExplorerPlace } from '../explorer-detail/explorerDetail.types'
import { useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'

// 컴포넌트 내부
const isMobile = useIsMobile()
const [viewMode] = useExplorerViewMode()
const setExplorerPlace = useSetExplorerPlace()
const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()

const openDetail = (place: MostSavedPlace) => {
  if (isMobile) return openFullScreen(place)
  if (viewMode === 'list') return setExplorerPlace(place)
  openSideSheet(place)
}
```

- [ ] **Step 3: `TopVisitedSection.tsx` 수정**

동일 패턴 적용:

```tsx
import { useSetExplorerPlace } from '../explorer-detail/explorerDetail.types'
import { useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'

// 컴포넌트 내부
const isMobile = useIsMobile()
const [viewMode] = useExplorerViewMode()
const setExplorerPlace = useSetExplorerPlace()
const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()

// PlaceListItem onClick
onClick={() => {
  if (isMobile) return openFullScreen(place)
  if (viewMode === 'list') return setExplorerPlace(place)
  openSideSheet(place)
}}
```

- [ ] **Step 4: 빌드 확인**

```bash
npx tsc -b --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/explorer/explorer-recent/RecentHotSection.tsx \
        src/features/explorer/explorer-saved/MostSavedSection.tsx \
        src/features/explorer/explorer-ranking/TopVisitedSection.tsx
git commit -m "feat: 탐색 섹션 리스트 뷰 클릭 시 push 패널 연결"
```

---

## Task 6: 동작 확인 (수동)

- [ ] **Step 1: 개발 서버 실행**

```bash
yarn dev
```

- [ ] **Step 2: 리스트 뷰 확인**

브라우저에서 `/explorer` 접속 → 리스트 뷰 선택 → 장소 카드 클릭:
- 사이드 패널이 오른쪽에서 슬라이드 인
- 카탈로그 콘텐츠가 왼쪽으로 밀려남 (오버레이 아님)
- 닫기 버튼 클릭 시 패널이 닫히고 콘텐츠가 복원됨

- [ ] **Step 3: 지도 뷰 확인**

지도 뷰 선택 → 마커 클릭:
- 기존 오버레이 Drawer 방식 유지

- [ ] **Step 4: 뷰 전환 확인**

리스트 뷰에서 패널 열린 상태 → 지도 뷰로 전환:
- 패널이 자동으로 닫힘
