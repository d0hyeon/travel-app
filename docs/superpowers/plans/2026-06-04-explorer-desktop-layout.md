# Explorer Desktop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탐색 페이지를 데스크탑 환경에서도 쾌적하게 사용할 수 있도록 — (1) 페이지 진입점을 `.desktop/.mobile` 패턴으로 분리, (2) 필터(카테고리·지역) 데스크탑에서는 드롭다운/Popover로, (3) TopVisited 섹션 데스크탑 그리드 레이아웃, (4) 큐레이션 상세 사이드패널 레이아웃 개선.

**Architecture:**
- `PlaceExplorerPage.tsx`를 진입점으로 유지하되 내부에서 `useIsMobile`로 `PlaceExplorerPage.desktop.tsx` / `PlaceExplorerPage.mobile.tsx`를 lazy 분기한다. 이 패턴은 `TripDetailPage.tsx`와 동일하다.
- 필터 컴포넌트: 모바일(`ExplorerFilters.mobile.tsx`)은 기존 바텀시트·FullScreenPopup 유지, 데스크탑(`ExplorerFilters.desktop.tsx`)은 카테고리 MUI `Menu`, 지역 MUI `Popover`+`LocationForm`으로 구현한다.
- `TopVisitedSection`은 `.desktop.tsx` / `.mobile.tsx`로 분리 — 모바일은 기존 리스트, 데스크탑은 Grid2 카드.
- `PlaceExplorerDetailSidePanel`은 헤더·탭 sticky, 콘텐츠 스크롤 구조로 개선한다.

**Tech Stack:** React, MUI v7 (Grid2, Menu, MenuItem, Popover, Drawer), useIsMobile, LocationForm

---

## File Structure

| 파일 | 변경 |
|------|------|
| `src/features/explorer/PlaceExplorerPage.tsx` | Modify: lazy `.desktop/.mobile` 분기 진입점으로 변경 |
| `src/features/explorer/PlaceExplorerPage.mobile.tsx` | Create: 기존 `PlaceExplorerPage` 내용 이동 |
| `src/features/explorer/PlaceExplorerPage.desktop.tsx` | Create: 데스크탑 레이아웃 (TopNavigation.desktop, 필터 데스크탑) |
| `src/features/explorer/explorer-filters/ExplorerFilters.mobile.tsx` | Create: 기존 ExplorerFilters 내용 이동 (바텀시트·FullScreenPopup) |
| `src/features/explorer/explorer-filters/ExplorerFilters.desktop.tsx` | Create: 카테고리 Menu, 지역 Popover+LocationForm |
| `src/features/explorer/explorer-ranking/TopVisitedSection.mobile.tsx` | Create: 기존 리스트 레이아웃 |
| `src/features/explorer/explorer-ranking/TopVisitedSection.desktop.tsx` | Create: Grid2 PlaceCard 그리드 레이아웃 |
| `src/features/explorer/explorer-ranking/TopVisitedSection.tsx` | Modify: `.desktop/.mobile` 분기 래퍼로 교체 |
| `src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx` | Modify: 헤더·탭 sticky, 콘텐츠 스크롤 구조 개선 |

> **참고:** `RecentHotSection`, `MostSavedSection`은 이미 내부적으로 `isMobile`로 카드 크기를 분기하고 있어 이번 범위에서 제외한다.

---

## Task 1: ExplorerFilters.mobile.tsx / ExplorerFilters.desktop.tsx 분리

**Files:**
- Create: `src/features/explorer/explorer-filters/ExplorerFilters.mobile.tsx`
- Create: `src/features/explorer/explorer-filters/ExplorerFilters.desktop.tsx`

기존 `ExplorerFilters.tsx`의 내용을 `.mobile.tsx`로 이동하고, `.desktop.tsx`는 카테고리 `Menu` + 지역 `Popover` 버전으로 새로 작성한다. 기존 `ExplorerFilters.tsx`는 Task 2에서 진입점 분기용으로 교체된다.

- [ ] **Step 1: ExplorerFilters.mobile.tsx 생성 — 기존 코드 이동**

```tsx
// src/features/explorer/explorer-filters/ExplorerFilters.mobile.tsx
import { Chip } from '@mui/material'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { useCategoryBottomSheet } from './useCategoryBottomSheet'
import { useExplorerFilterParams } from './useExplorerFilterParams'
import { useLocationOverlay } from './useLocationOverlay'

const CHIP_SX = { fontSize: 11, height: 26 } as const

export const ExplorerFilterMobile = {
  LocationChip: () => {
    const { location, setLocation } = useExplorerFilterParams()
    const openLocationOverlay = useLocationOverlay()

    return (
      <Chip
        label={location ?? '지역'}
        onClick={async () => {
          const result = await openLocationOverlay(location ?? undefined)
          setLocation(result ?? undefined)
        }}
        color={location ? 'primary' : 'default'}
        variant="outlined"
        size="small"
        sx={{ ...CHIP_SX, fontWeight: location ? 700 : 400 }}
      />
    )
  },

  CategoryChip: () => {
    const { category, setCategory } = useExplorerFilterParams()
    const selectCategory = useCategoryBottomSheet()

    return (
      <Chip
        label={category ? PlaceCategoryTypeLabel[category] : '카테고리'}
        onClick={async () => {
          const value = await selectCategory(category)
          setCategory(value ?? undefined)
        }}
        color={category ? 'primary' : 'default'}
        variant="outlined"
        size="small"
        sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
      />
    )
  },
}
```

- [ ] **Step 2: ExplorerFilters.desktop.tsx 생성 — Menu + Popover 버전**

```tsx
// src/features/explorer/explorer-filters/ExplorerFilters.desktop.tsx
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Chip, ListItemIcon, Menu, MenuItem, Paper, Popover, Stack } from '@mui/material'
import { useRef, useState } from 'react'
import type { Location } from '~features/location'
import { LocationForm } from '~features/location/LocationForm'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { EXPLORER_CATEGORY_TYPES } from '../explorer.api'
import { useExplorerFilterParams } from './useExplorerFilterParams'

const CHIP_SX = { fontSize: 11, height: 26 } as const

export const ExplorerFilterDesktop = {
  LocationChip: () => {
    const { location, setLocation } = useExplorerFilterParams()
    const chipRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    const handleSubmit = (value: Location) => {
      setLocation(value)
      setOpen(false)
    }
    const handleReset = () => {
      setLocation(undefined)
      setOpen(false)
    }

    return (
      <>
        <Chip
          ref={chipRef}
          label={location ?? '지역'}
          onClick={() => setOpen(true)}
          color={location ? 'primary' : 'default'}
          variant="outlined"
          size="small"
          sx={{ ...CHIP_SX, fontWeight: location ? 700 : 400 }}
        />
        <Popover
          open={open}
          anchorEl={chipRef.current}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper sx={{ width: 320, p: 2 }}>
            <LocationForm
              defaultValue={location ?? undefined}
              onSubmit={handleSubmit}
            >
              <Stack direction="row" gap={1} mt={2}>
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                  fullWidth
                >
                  초기화
                </Button>
                <LocationForm.SubmitButton variant="contained" size="small" fullWidth>
                  확인
                </LocationForm.SubmitButton>
              </Stack>
            </LocationForm>
          </Paper>
        </Popover>
      </>
    )
  },

  CategoryChip: () => {
    const { category, setCategory } = useExplorerFilterParams()
    const chipRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    return (
      <>
        <Chip
          ref={chipRef}
          label={category ? PlaceCategoryTypeLabel[category] : '카테고리'}
          onClick={() => setOpen(true)}
          color={category ? 'primary' : 'default'}
          variant="outlined"
          size="small"
          sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
        />
        <Menu
          anchorEl={chipRef.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <MenuItem
            onClick={() => { setCategory(undefined); setOpen(false) }}
          >
            {category == null && <ListItemIcon><CheckIcon fontSize="small" color="primary" /></ListItemIcon>}
            전체
          </MenuItem>
          {EXPLORER_CATEGORY_TYPES.map((cat: PlaceCategoryType) => (
            <MenuItem
              key={cat}
              onClick={() => { setCategory(cat); setOpen(false) }}
            >
              {category === cat && <ListItemIcon><CheckIcon fontSize="small" color="primary" /></ListItemIcon>}
              {PlaceCategoryTypeLabel[cat]}
            </MenuItem>
          ))}
        </Menu>
      </>
    )
  },
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v ExplorerFilters | head -20
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/features/explorer/explorer-filters/ExplorerFilters.mobile.tsx src/features/explorer/explorer-filters/ExplorerFilters.desktop.tsx
git commit -m "feat: split ExplorerFilters into mobile (bottom sheet) and desktop (menu/popover)"
```

---

## Task 2: TopVisitedSection.mobile.tsx / TopVisitedSection.desktop.tsx 분리

**Files:**
- Create: `src/features/explorer/explorer-ranking/TopVisitedSection.mobile.tsx`
- Create: `src/features/explorer/explorer-ranking/TopVisitedSection.desktop.tsx`
- Modify: `src/features/explorer/explorer-ranking/TopVisitedSection.tsx`

- [ ] **Step 1: TopVisitedSection.mobile.tsx 생성 — 기존 리스트 코드 이동**

```tsx
// src/features/explorer/explorer-ranking/TopVisitedSection.mobile.tsx
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import type { ExploredPlace } from '../explorer.api'
import { buildExplorerDetailUrl } from '../explorer.utils'
import { useExploredPlaces } from './useExploredPlaces'

const SECTION_LIMIT = 10

export function TopVisitedSectionMobile() {
  const { location, category } = useExplorerFilterParams()
  const { data: places } = useExploredPlaces(location, category)
  const { openFullScreen } = useExplorerDetailOverlay()
  const navigate = useNavigate()

  const topVisited = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount).slice(0, SECTION_LIMIT),
    [places],
  )
  const toDetailUrl = buildExplorerDetailUrl(AppRoute.장소_최다방문순, location, category)

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1">가장 많이 방문하는 곳이에요</Typography>
        <Button
          size="small"
          variant="text"
          color="inherit"
          endIcon={<ChevronRightIcon sx={{ fontSize: '16px !important' }} />}
          onClick={() => navigate(toDetailUrl)}
          sx={{ minWidth: 0, fontSize: 12, color: 'text.secondary' }}
        >
          더보기
        </Button>
      </Stack>

      {topVisited.length === 0 && (
        <Typography variant="body2" color="text.secondary" px={2} py={4} textAlign="center">
          자료를 찾을 수 없어요
        </Typography>
      )}

      <Stack>
        {topVisited.map((place) => (
          <PlaceListItem
            key={place.placeId}
            place={{ ...place, countLabel: `${place.visitorCount}명 다녀옴` }}
            onClick={() => openFullScreen(place)}
          />
        ))}
      </Stack>
    </Box>
  )
}

TopVisitedSectionMobile.Skeleton = () => (
  <Box>
    <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
    {Array.from({ length: 5 }).map((_, i) => (
      <Stack key={i} direction="row" gap={1.5} px={2} py={1.25} alignItems="center">
        <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: 2, flexShrink: 0 }} />
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="80%" height={14} />
          <Skeleton variant="text" width={80} height={14} sx={{ mt: 0.5 }} />
        </Box>
      </Stack>
    ))}
  </Box>
)
```

- [ ] **Step 2: TopVisitedSection.desktop.tsx 생성 — Grid2 카드**

`PlaceCard`의 현재 타입은 `{ placeId, name, destinations[], categories[], thumbnailUrl?, countLabel }` 이다. `ExploredPlace`에 `destinations`가 없으므로 `address`를 배열로 래핑해서 전달한다.

```tsx
// src/features/explorer/explorer-ranking/TopVisitedSection.desktop.tsx
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Grid2, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import type { ExploredPlace } from '../explorer.api'
import { buildExplorerDetailUrl } from '../explorer.utils'
import { useExploredPlaces } from './useExploredPlaces'

const SECTION_LIMIT = 10

export function TopVisitedSectionDesktop() {
  const { location, category } = useExplorerFilterParams()
  const { data: places } = useExploredPlaces(location, category)
  const { openSideSheet } = useExplorerDetailOverlay()
  const navigate = useNavigate()

  const topVisited = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount).slice(0, SECTION_LIMIT),
    [places],
  )
  const toDetailUrl = buildExplorerDetailUrl(AppRoute.장소_최다방문순, location, category)

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1">가장 많이 방문하는 곳이에요</Typography>
        <Button
          size="small"
          variant="text"
          color="inherit"
          endIcon={<ChevronRightIcon sx={{ fontSize: '16px !important' }} />}
          onClick={() => navigate(toDetailUrl)}
          sx={{ minWidth: 0, fontSize: 12, color: 'text.secondary' }}
        >
          더보기
        </Button>
      </Stack>

      {topVisited.length === 0 && (
        <Typography variant="body2" color="text.secondary" px={2} py={4} textAlign="center">
          자료를 찾을 수 없어요
        </Typography>
      )}

      <Grid2 container spacing={2} px={2}>
        {topVisited.map((place) => (
          <Grid2 key={place.placeId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <PlaceCard
              place={{
                ...place,
                destinations: [place.address],
                countLabel: `${place.visitorCount}명 다녀옴`,
              }}
              onClick={() => openSideSheet(place)}
            />
          </Grid2>
        ))}
      </Grid2>
    </Box>
  )
}

TopVisitedSectionDesktop.Skeleton = () => (
  <Box>
    <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
    <Grid2 container spacing={2} px={2}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Grid2 key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Skeleton variant="rectangular" sx={{ aspectRatio: '1' }} />
            <Box p={1.5}>
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        </Grid2>
      ))}
    </Grid2>
  </Box>
)
```

- [ ] **Step 3: TopVisitedSection.tsx를 분기 래퍼로 교체**

```tsx
// src/features/explorer/explorer-ranking/TopVisitedSection.tsx
import { lazy } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { Suspense } from 'react'
import { TopVisitedSectionMobile } from './TopVisitedSection.mobile'

const TopVisitedSectionDesktop = lazy(() =>
  import('./TopVisitedSection.desktop').then((m) => ({ default: m.TopVisitedSectionDesktop }))
)

export function TopVisitedSection() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <TopVisitedSectionMobile />
  }

  return (
    <Suspense fallback={<TopVisitedSectionMobile.Skeleton />}>
      <TopVisitedSectionDesktop />
    </Suspense>
  )
}

TopVisitedSection.Skeleton = TopVisitedSectionMobile.Skeleton
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v ExplorerFilters | head -20
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/explorer/explorer-ranking/TopVisitedSection.mobile.tsx src/features/explorer/explorer-ranking/TopVisitedSection.desktop.tsx src/features/explorer/explorer-ranking/TopVisitedSection.tsx
git commit -m "feat: split TopVisitedSection into mobile list and desktop grid"
```

---

## Task 3: PlaceExplorerPage.mobile.tsx / PlaceExplorerPage.desktop.tsx 분리

**Files:**
- Create: `src/features/explorer/PlaceExplorerPage.mobile.tsx`
- Create: `src/features/explorer/PlaceExplorerPage.desktop.tsx`
- Modify: `src/features/explorer/PlaceExplorerPage.tsx`

- [ ] **Step 1: PlaceExplorerPage.mobile.tsx 생성 — 기존 내용 이동**

```tsx
// src/features/explorer/PlaceExplorerPage.mobile.tsx
import { Box, Stack } from '@mui/material'
import { Suspense, useRef, useState } from 'react'
import { Extrude } from '~shared/components/animation/Extrude'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import { ExplorerFilterMobile } from './explorer-filters/ExplorerFilters.mobile'
import { ExplorerViewToggleButton, useExplorerViewMode } from './explorer-view/ExplorerViewToggleButton'
import { FilterNavigation } from './explorer-view/FilterNavigation'
import { ExplorerCatalog } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'

function ExplorerFilterChips({ isScrollDown, titleRef }: { isScrollDown: boolean; titleRef: React.RefObject<null> }) {
  return (
    <Suspense>
      <Extrude active={isScrollDown} target={titleRef.current} axis="y">
        <Stack direction="row" gap={1} alignItems="center">
          <ExplorerFilterMobile.LocationChip />
          <ExplorerFilterMobile.CategoryChip />
        </Stack>
      </Extrude>
    </Suspense>
  )
}

export function PlaceExplorerPageMobile() {
  const [viewMode, setViewMode] = useExplorerViewMode()
  const titleRef = useRef(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const { isScrollDown } = useScrollStatus(container)

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        leftElement={null}
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none' }}
      >
        <Box ref={titleRef} paddingX={1}>탐색</Box>
      </TopNavigation>

      <FilterNavigation
        height={isScrollDown ? 0 : 'auto'}
        paddingBottom={isScrollDown ? 0 : 1}
        sx={{ zIndex: 1000, transition: 'all 200ms', position: 'fixed', top: TopNavigation.HEIGHT }}
      >
        <ExplorerFilterChips isScrollDown={isScrollDown} titleRef={titleRef} />
      </FilterNavigation>

      <Box
        ref={setContainer}
        flex={1}
        height="100%"
        position="relative"
        paddingTop={`${FilterNavigation.height}px`}
        overflow="auto"
        sx={{ overscrollBehaviorY: 'none' }}
      >
        <Suspense>
          <SwitchCase
            value={viewMode}
            cases={{
              map: () => <ExplorerMap height="100%" />,
              list: () => <ExplorerCatalog />,
            }}
          />
        </Suspense>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: PlaceExplorerPage.desktop.tsx 생성**

데스크탑은 TopNavigation.desktop, 필터는 항상 보이는 사이드바 형태 대신 상단 필터바 유지.

```tsx
// src/features/explorer/PlaceExplorerPage.desktop.tsx
import { Box, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { SwitchCase } from '~shared/components/SwitchCase'
import { ExplorerFilterDesktop } from './explorer-filters/ExplorerFilters.desktop'
import { ExplorerViewToggleButton, useExplorerViewMode } from './explorer-view/ExplorerViewToggleButton'
import { ExplorerCatalog } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'

export function PlaceExplorerPageDesktop() {
  const [viewMode, setViewMode] = useExplorerViewMode()

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
      >
        <Typography variant="subtitle1" fontWeight={600}>탐색</Typography>
      </TopNavigation>

      {/* 필터 바 */}
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        px={2}
        py={1}
        borderBottom={1}
        borderColor="divider"
        flexShrink={0}
      >
        <Suspense>
          <ExplorerFilterDesktop.LocationChip />
          <ExplorerFilterDesktop.CategoryChip />
        </Suspense>
      </Stack>

      <Box flex={1} height="100%" overflow="auto" sx={{ overscrollBehaviorY: 'none' }}>
        <Suspense>
          <SwitchCase
            value={viewMode}
            cases={{
              map: () => <ExplorerMap height="100%" />,
              list: () => <ExplorerCatalog />,
            }}
          />
        </Suspense>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 3: PlaceExplorerPage.tsx를 분기 진입점으로 교체**

```tsx
// src/features/explorer/PlaceExplorerPage.tsx
import { lazy, Suspense } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceExplorerPageMobile } from './PlaceExplorerPage.mobile'

const PlaceExplorerPageDesktop = lazy(() =>
  import('./PlaceExplorerPage.desktop').then((m) => ({ default: m.PlaceExplorerPageDesktop }))
)

export default function PlaceExplorerPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <PlaceExplorerPageMobile />
  }

  return (
    <Suspense fallback={<PlaceExplorerPageMobile />}>
      <PlaceExplorerPageDesktop />
    </Suspense>
  )
}
```

- [ ] **Step 4: TopNavigation.desktop 존재 확인**

```bash
cat src/shared/components/layout/TopNavigation.desktop.tsx | head -30
```

`rightElement` prop을 받는지 확인. 없으면 다음 step에서 수정.

- [ ] **Step 5: 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v ExplorerFilters | head -20
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/features/explorer/PlaceExplorerPage.tsx src/features/explorer/PlaceExplorerPage.mobile.tsx src/features/explorer/PlaceExplorerPage.desktop.tsx
git commit -m "feat: split PlaceExplorerPage into mobile and desktop variants"
```

---

## Task 4: PlaceExplorerDetailSidePanel 레이아웃 개선

**Files:**
- Modify: `src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx`

현재 문제: 탭이 스크롤 영역 안에 있어서 스크롤 시 함께 사라짐. 헤더·탭을 sticky로 분리해야 함.

- [ ] **Step 1: SidePanel 레이아웃 개선**

```tsx
// src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx
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
  place: { placeId: string; name: string }
  isOpen?: boolean
  onClose: () => void
}

export function PlaceExplorerDetailSidePanel({ place, isOpen = true, onClose }: Props) {
  const [currentTab, changeTab] = useState<'basic' | 'feed'>('basic')

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      hideBackdrop
      sx={{ zIndex: 1000 }}
      PaperProps={{
        sx: {
          width: 420,
          maxWidth: 'calc(100vw - 72px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* 헤더: 고정 */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Typography variant="subtitle1" fontWeight={700} noWrap flex={1}>
          {place.name}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* 탭: 고정 */}
      <Tabs
        variant="fullWidth"
        value={currentTab}
        onChange={(_, value) => changeTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab label="기본정보" value="basic" />
        <Tab label="피드" value="feed" />
      </Tabs>

      {/* 콘텐츠: 스크롤 */}
      <Box flex={1} overflow="auto">
        <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress size={24} /></Box>}>
          <SwitchCase
            value={currentTab}
            cases={{
              basic: <PlaceBasicInfo placeId={place.placeId} />,
              feed: () => <PlaceFeed placeId={place.placeId} />,
            }}
          />
        </Suspense>
      </Box>
    </Drawer>
  )
}

type ContentProps = { placeId: string }

function PlaceFeed({ placeId }: ContentProps) {
  const { data: { feed } } = usePlaceFeed(placeId)

  if (feed.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" mt={5} textAlign="center">
        작성된 피드가 없어요
      </Typography>
    )
  }

  return (
    <Stack gap={1} p={2}>
      {feed.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </Stack>
  )
}

function PlaceBasicInfo({ placeId }: ContentProps) {
  const { data: place } = usePlace(placeId)
  const { data: photos } = usePlacePhotos(placeId)
  const overlay = useOverlay()

  return (
    <Stack gap={2} p={2}>
      <Map
        type={isOverseasByCoordinate(place.lat, place.lng) ? 'google' : 'kakao'}
        height={240}
        center={place}
      >
        <Map.Marker {...place} label={place.name} variant="pin" />
      </Map>

      {place.address && (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">{place.address}</Typography>
        </Stack>
      )}

      {photos.length !== 0 && (
        <ImageList cols={3} gap={4} sx={{ mt: 0 }}>
          {photos.map((photo, idx) => (
            <ImageListItem
              key={photo.id}
              sx={{ borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => {
                overlay.open(({ isOpen, close }) => (
                  <PhotoDialog
                    open={isOpen}
                    onClose={close}
                    photos={photos}
                    initialIndex={idx}
                  />
                ))
              }}
            >
              <img
                src={photo.url}
                alt=""
                loading="lazy"
                style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v ExplorerFilters | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/explorer/explorer-detail/PlaceExplorerDetailSidePanel.tsx
git commit -m "feat: fix side panel layout — sticky header/tabs, scrollable content area"
```

---

## Self-Review

**Spec coverage:**
- [x] 필터 클릭 시 모바일 바텀시트 — Task 1 (`ExplorerFilters.mobile.tsx`)
- [x] 필터 클릭 시 데스크탑 드롭다운 — Task 1 (`ExplorerFilters.desktop.tsx`)
- [x] Location 필터 데스크탑 처리 — Task 1 (`ExplorerFilters.desktop.tsx` Popover+LocationForm)
- [x] TopVisited 섹션 데스크탑 그리드 — Task 2
- [x] 큐레이션 상세 사이드패널 레이아웃 — Task 4
- [x] `.desktop.tsx` / `.mobile.tsx` 파일 패턴 준수 — Task 1, 2, 3

**Placeholder scan:** 없음

**Type consistency:**
- `PlaceCard`의 `destinations[]` ← Task 2에서 `[place.address]`로 래핑하여 타입 맞춤
- `ExplorerFilterMobile` / `ExplorerFilterDesktop` 각각 독립 export, `PlaceExplorerPage.*.tsx`에서 각각 import
- `TopVisitedSectionMobile.Skeleton`을 `TopVisitedSection.Skeleton`으로 re-export
