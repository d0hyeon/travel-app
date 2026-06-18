import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { Box, Button, CircularProgress, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { useRoadRoute } from '~features/route/road-route/useRoadRoute'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { Map } from '~shared/components/Map'
import { useOverlay } from '~shared/hooks/useOverlay'
import type { Coordinate } from '~shared/types/coordinate'
import { createTripPlace } from '../../place/place.api'
import { useTripPlaces } from '../trip-place/useTripPlaces'
import { useTrip } from '../useTrip'
import type { CommunityPlace, CommunityTrip } from './communityRoute.types'
import { useCommunityRouteDetail } from './useCommunityRouteDetail'

interface Props {
  communityTrip: CommunityTrip
  tripId: string
  isOpen: boolean
  onClose: () => void
}

export function useCommunityRouteDetailOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (params: Omit<Props, 'isOpen' | 'onClose'>) => {
      overlay.open(({ isOpen, close }) => (
        <CommunityRouteDetailSheet {...params} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { open }
}

function CommunityRouteDetailSheet({ communityTrip, tripId, isOpen, onClose }: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.85, 1]} defaultSnapIndex={0}>
      <BottomSheet.Body sx={{ p: 0 }}>
        <Suspense fallback={<DetailSkeleton />}>
          <DetailContent communityTrip={communityTrip} tripId={tripId} />
        </Suspense>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

function DetailContent({ communityTrip, tripId }: { communityTrip: CommunityTrip; tripId: string }) {
  const { data: routes } = useCommunityRouteDetail(communityTrip.id)
  const { data: myPlaces } = useTripPlaces(tripId);
  const { data: { isOverseas } } = useTrip(tripId)

  const myPlaceIds = useMemo(() => new Set(myPlaces.map((p) => p.id)), [myPlaces])

  const datedRoutes = routes.filter((r) => r.scheduledDate)
  const undatedRoutes = routes.filter((r) => !r.scheduledDate)
  const tabRoutes = datedRoutes.length > 0 ? datedRoutes : undatedRoutes

  const [selectedRouteId, setSelectedRouteId] = useState<string>(tabRoutes[0]?.id ?? '')
  const currentRoute = tabRoutes.find((r) => r.id === selectedRouteId) ?? tabRoutes[0]

  if (routes.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="body2" color="text.secondary">
          아직 등록된 경로가 없어요
        </Typography>
      </Box>
    )
  }

  const mapCenter = currentRoute?.places[0]
    ? { lat: currentRoute.places[0].lat, lng: currentRoute.places[0].lng }
    : undefined

  return (
    <Stack height="100%">
      {/* 날짜 탭 */}
      {tabRoutes.length > 1 && (
        <Tabs
          value={selectedRouteId}
          onChange={(_, v) => setSelectedRouteId(v)}
          variant="scrollable"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40, flexGrow: 0, }}
        >
          {tabRoutes.map((route, idx) => {
            const MS_PER_DAY = 24 * 60 * 60 * 1000
            const dayNum = route.scheduledDate
              ? Math.round((new Date(route.scheduledDate).getTime() - new Date(communityTrip.startDate).getTime()) / MS_PER_DAY) + 1
              : idx + 1
            return (
              <Tab
                key={route.id}
                value={route.id}
                label={`${dayNum}일차`}
                sx={{ minHeight: 40 }}
              />
            )
          })}
        </Tabs>
      )}

      {/* 지도 */}
      {mapCenter && currentRoute && currentRoute.places.length >= 2 && (
        <BottomSheet.Scrollable height={200} flexShrink={0}>
          <Map
            type={isOverseas ? 'google' : 'kakao'}
            defaultCenter={mapCenter}
            autoFocus="path"
            height="100%"
            clustering={false}
          >
            {currentRoute.places.map((place, idx) => (
              <Map.Marker
                key={place.id}
                lat={place.lat}
                lng={place.lng}
                label={`${idx + 1}. ${place.name}`}
                color={myPlaceIds.has(place.id) ? "selected" : "disabled"}
              />
            ))}
            <Suspense>
              <RoadPath waypoints={currentRoute.places.map((p) => ({ lat: p.lat, lng: p.lng }))} />
            </Suspense>
          </Map>
        </BottomSheet.Scrollable>
      )}
      <BottomSheet.Scrollable flex="1" overflow="auto">
        {/* 장소 목록 */}
        {currentRoute?.places.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            경로에 장소가 없어요
          </Typography>
        )}
        {currentRoute?.places.map((place, idx) => (
          <PlaceRow
            key={place.id}
            place={place}
            index={idx}
            tripId={tripId}
            alreadyAdded={myPlaceIds.has(place.id)}
          />
        ))}
      </BottomSheet.Scrollable>
    </Stack>
  )
}

interface PlaceRowProps {
  place: CommunityPlace
  index: number
  tripId: string
  alreadyAdded: boolean
}

function PlaceRow({ place, index, tripId, alreadyAdded }: PlaceRowProps) {
  const { refetch } = useTripPlaces(tripId)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(alreadyAdded)

  const handleAdd = async () => {
    setAdding(true)
    try {
      await createTripPlace({ tripId, placeId: place.id, status: 'wished' })
      setAdded(true)
      refetch()
    } finally {
      setAdding(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* 순서 번호 */}
      <Box
        sx={{
          minWidth: 24,
          minHeight: 24,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 'bold',
          flexShrink: 0,
          opacity: added ? 0.4 : 1,
        }}
      >
        {index + 1}
      </Box>

      {/* 장소 정보 */}
      <Stack flex={1} minWidth={0}>
        <Typography
          variant="body2"
          fontWeight="medium"
          noWrap
          sx={{ color: added ? 'text.disabled' : 'text.primary' }}
        >
          {place.name}
        </Typography>
        {place.address && (
          <Typography variant="caption" color="text.disabled" noWrap>
            {place.address}
          </Typography>
        )}
      </Stack>

      {/* 추가 버튼 */}
      <Box flexShrink={0}>
        {added ? (
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: 'success.main' }}>
            <CheckIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight="medium">추가됨</Typography>
          </Stack>
        ) : (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            disabled={adding}
            onClick={handleAdd}
            sx={{
              minWidth: 56,
              height: 28,
              fontSize: 12,
              borderRadius: 1.5,
              px: 1,
            }}
          >
            {adding ? <CircularProgress size={12} /> : <><AddIcon sx={{ fontSize: 14, mr: 0.25 }} />추가</>}
          </Button>
        )}
      </Box>
    </Box>
  )
}

function RoadPath({ waypoints }: { waypoints: Coordinate[] }) {
  const coordinates = useRoadRoute({ waypoints })
  if (!coordinates || coordinates.length < 2) return null
  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor="#1976d2"
      strokeWeight={3}
      strokeOpacity={0.8}
    />
  )
}

function DetailSkeleton() {
  return (
    <Stack p={2} gap={1.5}>
      <Skeleton variant="rounded" height={180} />
      {[0, 1, 2].map((i) => (
        <Stack key={i} direction="row" alignItems="center" gap={1}>
          <Skeleton variant="circular" width={22} height={22} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rounded" width={60} height={28} sx={{ ml: 'auto' }} />
        </Stack>
      ))}
    </Stack>
  )
}
