import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CheckIcon from '@mui/icons-material/Check'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import type { Location } from '~features/location'
import { LocationForm } from '~features/location/LocationForm'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { BottomArea } from '~shared/components/BottomArea'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { ListItem } from '~shared/components/ListItem'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import type { ExploredPlace } from './explorer.api'
import { useExplorerDetailOverlay } from './explorer-detail/useExplorerDetailOverlay'
import { useExploredPlaces } from './useExploredPlaces'
import { useRecentHotPlaces } from './useRecentHotPlaces'

const PERIOD_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
] as const

type PeriodMonths = (typeof PERIOD_OPTIONS)[number]['value']

const SECTION_LIMIT = 10

interface ExplorerCatalogProps {
  location?: Location | null
  category?: PlaceCategoryType | null
}

export function ExplorerCatalog({ location, category }: ExplorerCatalogProps) {
  return (
    <Box py={2}>
      <Suspense fallback={<HorizontalSectionSkeleton />}>
        <RecentHotSection location={location} category={category} />
      </Suspense>
      <Suspense fallback={<ListSectionSkeleton />}>
        <TopVisitedSection location={location} category={category} />
      </Suspense>
    </Box>
  )
}

// ─── 최근 핫플레이스 (가로 스크롤) ───────────────────────────────────────────

interface SectionProps {
  location?: Location | null
  category?: PlaceCategoryType | null
}

function RecentHotSection({ location, category }: SectionProps) {
  const [months, setMonths] = useState<PeriodMonths>(3)
  const { data: places } = useRecentHotPlaces(months, location, category)
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)
  const openPeriodSheet = usePeriodBottomSheet(months, setMonths)
  const navigate = useNavigate()

  const recentHot = useMemo(
    () => places.toReversed().slice(0, SECTION_LIMIT),
    [places],
  )

  const currentLabel = PERIOD_OPTIONS.find((o) => o.value === months)?.label ?? ''

  return (
    <Box mb={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1" fontWeight={900}>
          ✨ 최근 핫플레이스
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Button
            size="small"
            variant="text"
            color="info"
            startIcon={<CalendarTodayIcon sx={{ fontSize: '14px !important' }} />}
            onClick={openPeriodSheet}
            sx={{ minWidth: 0, fontSize: 12 }}
          >
            {currentLabel}
          </Button>
          <Button
            size="small"
            variant="text"
            color="inherit"
            endIcon={<ChevronRightIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => navigate(AppRoute.탐색_최근핫플)}
            sx={{ minWidth: 0, fontSize: 12, color: 'text.secondary' }}
          >
            더보기
          </Button>
        </Stack>
      </Stack>

      {recentHot.length === 0 ? (
        <Typography variant="body2" color="text.secondary" px={2}>해당 기간 내 핫플레이스가 없습니다.</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1.5,
            overflowX: 'auto',
            px: 2,
            pb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {recentHot.map((place) => (
            <HorizontalPlaceCard
              key={place.placeId}
              place={place}
              onClick={() => openDetail(place)}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

// ─── 최다 방문 (리스트 뷰) ────────────────────────────────────────────────────

function TopVisitedSection({ location, category }: SectionProps) {
  const { data: places } = useExploredPlaces(location, category)
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)
  const navigate = useNavigate()

  const topVisited = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount).slice(0, SECTION_LIMIT),
    [places],
  )

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1" fontWeight={900}>
          🔥 최다 방문
        </Typography>
        <Button
          size="small"
          variant="text"
          color="inherit"
          endIcon={<ChevronRightIcon sx={{ fontSize: '16px !important' }} />}
          onClick={() => navigate(AppRoute.탐색_최다방문)}
          sx={{ minWidth: 0, fontSize: 12, color: 'text.secondary' }}
        >
          더보기
        </Button>
      </Stack>

      <Stack>
        {topVisited.map((place) => (
          <PlaceListItem key={place.placeId} place={place} onClick={() => openDetail(place)} />
        ))}
      </Stack>
    </Box>
  )
}

// ─── HorizontalPlaceCard ──────────────────────────────────────────────────────

function HorizontalPlaceCard({ place, onClick }: { place: ExploredPlace; onClick: () => void }) {
  const categoryLabel = place.categories[0] ? PlaceCategoryTypeLabel[place.categories[0]] : null

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden', flexShrink: 0, width: 140 }}
    >
      <CardActionArea onClick={onClick}>
        <CardMedia
          component="div"
          sx={{
            height: 140,
            bgcolor: 'grey.100',
            backgroundImage: place.thumbnailUrl ? `url(${place.thumbnailUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {!place.thumbnailUrl && <LocationOnIcon sx={{ fontSize: 36, color: 'grey.300' }} />}
          {categoryLabel && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.45)',
                borderRadius: 1,
                px: 0.75,
                py: 0.25,
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontSize: 10, lineHeight: 1.4 }}>
                {categoryLabel}
              </Typography>
            </Box>
          )}
        </CardMedia>
        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight={700} noWrap title={place.name}>
            {place.name}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
            <PeopleIcon sx={{ fontSize: 11, color: 'primary.main' }} />
            <Typography variant="caption" color="primary" fontWeight={700}>
              {place.visitorCount}번 방문
            </Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  )
}

// ─── PlaceListItem ────────────────────────────────────────────────────────────

export function PlaceListItem({ place, onClick }: { place: ExploredPlace; onClick: () => void }) {
  const categoryLabel = place.categories[0] ? PlaceCategoryTypeLabel[place.categories[0]] : null
  const subText = [categoryLabel, place.address].filter(Boolean).join(' · ')

  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        border: 'none',
        bgcolor: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* 썸네일 */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 2,
          flexShrink: 0,
          bgcolor: 'grey.100',
          backgroundImage: place.thumbnailUrl ? `url(${place.thumbnailUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!place.thumbnailUrl && <LocationOnIcon sx={{ fontSize: 24, color: 'grey.300' }} />}
        {categoryLabel && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.45)',
              px: 0.5,
              py: 0.25,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: 9, lineHeight: 1.4 }}>
              {categoryLabel}
            </Typography>
          </Box>
        )}
      </Box>

      {/* 텍스트 */}
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {place.name}
        </Typography>
        {subText && (
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {subText}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
          <PeopleIcon sx={{ fontSize: 11, color: 'primary.main' }} />
          <Typography variant="caption" color="primary" fontWeight={700}>
            {place.visitorCount}명 다녀옴
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HorizontalSectionSkeleton() {
  return (
    <Box mb={3}>
      <Skeleton variant="text" width={140} height={28} sx={{ mx: 2, mb: 1.5 }} />
      <Stack direction="row" gap={1.5} px={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ width: 140, flexShrink: 0, borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Skeleton variant="rectangular" height={140} />
            <Box p={1.5}>
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function ListSectionSkeleton() {
  return (
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
}

// ─── usePeriodBottomSheet ─────────────────────────────────────────────────────

function usePeriodBottomSheet(months: PeriodMonths, onSelect: (v: PeriodMonths) => void) {
  const overlay = useOverlay()

  return useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onClose={close}>
        <BottomSheet.Header>기간 선택</BottomSheet.Header>
        <BottomSheet.Body>
          <Stack gap={1} pb={1}>
            {PERIOD_OPTIONS.map((opt) => (
              <ListItem.Button
                key={opt.value}
                onClick={() => { onSelect(opt.value); close() }}
                rightAddon={
                  opt.value === months
                    ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    : undefined
                }
                sx={{ border: 'none' }}
              >
                <ListItem.Title fontWeight={opt.value === months ? 700 : 400}>
                  {opt.label}
                </ListItem.Title>
              </ListItem.Button>
            ))}
          </Stack>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }, [overlay, months, onSelect])
}

// ─── useLocationOverlay ───────────────────────────────────────────────────────

export function useLocationOverlay() {
  const overlay = useOverlay()

  return useCallback((defaultValue?: Location) => {
    return new Promise<Location | null | undefined>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <FullScreenPopup isOpen={isOpen} onClose={() => { resolve(undefined); close() }}>
          <TopNavigation
            position="sticky"
            leftElement={null}
            rightElement={
              <IconButton size="small" onClick={() => { resolve(undefined); close() }}>
                <CloseIcon />
              </IconButton>
            }
          >
            지역 선택
          </TopNavigation>
          <Box sx={{ overflowY: 'auto' }}>
            <LocationForm
              defaultValue={defaultValue}
              onSubmit={(value) => { resolve(value); close() }}
              paddingTop={3}
            >
              <BottomArea position="fixed" bottom={0}>
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  size="large"
                  onClick={() => { resolve(null); close() }}
                  fullWidth
                >
                  초기화
                </Button>
                <LocationForm.SubmitButton variant="contained" size="large" fullWidth>
                  확인
                </LocationForm.SubmitButton>
              </BottomArea>
            </LocationForm>
          </Box>
        </FullScreenPopup>
      ))
    })
  }, [overlay])
}
