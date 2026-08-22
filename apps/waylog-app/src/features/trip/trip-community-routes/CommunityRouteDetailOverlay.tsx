import { MaterialIcons } from '@expo/vector-icons'
import {
  useCommunityRouteDetail,
  type CommunityPlace,
  type CommunityTrip,
} from '@waylog/domains/modules/community-route'
import { createTripPlace } from '@waylog/domains/modules/place'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import type { Coordinate } from '@waylog/utility'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRoadRoute } from '../../route/road-route/useRoadRoute'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Map } from '../../../shared/components/Map'
import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'
import { useOverlay } from '../../../shared/hooks/useOverlay'

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
      <BottomSheet.Body sx={{ padding: 0 }}>
        <Suspense fallback={<DetailSkeleton />}>
          <DetailContent communityTrip={communityTrip} tripId={tripId} />
        </Suspense>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function DetailContent({
  communityTrip,
  tripId,
}: {
  communityTrip: CommunityTrip
  tripId: string
}) {
  const { data: routes } = useCommunityRouteDetail(communityTrip.id)
  const { data: myPlaces } = useTripPlaces(tripId)

  const myPlaceIds = useMemo(() => myPlaces.map((place) => place.id), [myPlaces])

  const datedRoutes = routes.filter((route) => route.scheduledDate)
  const undatedRoutes = routes.filter((route) => !route.scheduledDate)
  const tabRoutes = datedRoutes.length > 0 ? datedRoutes : undatedRoutes

  const [selectedRouteId, setSelectedRouteId] = useState<string>(tabRoutes[0]?.id ?? '')
  const currentRoute = tabRoutes.find((route) => route.id === selectedRouteId) ?? tabRoutes[0]

  if (routes.length === 0) {
    return (
      <Box sx={{ padding: 24 }}>
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
    <Stack sx={{ flex: 1 }}>
      {tabRoutes.length > 1 && (
        <Tabs value={selectedRouteId} onChange={(_, value) => setSelectedRouteId(value)}>
          {tabRoutes.map((route, index) => {
            const dayNumber = route.scheduledDate
              ? Math.round(
                  (new Date(route.scheduledDate).getTime() -
                    new Date(communityTrip.startDate).getTime()) /
                    MS_PER_DAY,
                ) + 1
              : index + 1

            return <Tab key={route.id} value={route.id} label={`${dayNumber}일차`} />
          })}
        </Tabs>
      )}

      {mapCenter && currentRoute && currentRoute.places.length >= 2 && (
        <View style={{ height: 200 }}>
          <Map defaultCenter={mapCenter} autoFocus="path">
            {currentRoute.places.map((place, index) => (
              <Map.Marker
                key={place.id}
                lat={place.lat}
                lng={place.lng}
                label={`${index + 1}. ${place.name}`}
                color={myPlaceIds.includes(place.id) ? 'selected' : 'disabled'}
              />
            ))}
            <Suspense>
              <RoadPath
                waypoints={currentRoute.places.map((place) => ({
                  lat: place.lat,
                  lng: place.lng,
                }))}
              />
            </Suspense>
          </Map>
        </View>
      )}

      <BottomSheet.Scrollable>
        {currentRoute?.places.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ padding: 16 }}>
            경로에 장소가 없어요
          </Typography>
        )}
        {currentRoute?.places.map((place, index) => (
          <PlaceRow
            key={place.id}
            place={place}
            index={index}
            tripId={tripId}
            alreadyAdded={myPlaceIds.includes(place.id)}
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
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(alreadyAdded)

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      await createTripPlace({ tripId, placeId: place.id, status: 'wished' })
      setIsAdded(true)
      refetch()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      sx={{
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: palette.divider,
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: palette.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isAdded ? 0.4 : 1,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>
          {index + 1}
        </Typography>
      </Box>

      <Stack sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          numberOfLines={1}
          sx={{ color: isAdded ? palette.textSecondary : palette.text }}
        >
          {place.name}
        </Typography>
        {place.address && (
          <Typography variant="caption" color="text.secondary" numberOfLines={1}>
            {place.address}
          </Typography>
        )}
      </Stack>

      {isAdded ? (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <MaterialIcons name="check" size={14} color={palette.success} />
          <Typography variant="caption" sx={{ color: palette.success }}>
            추가됨
          </Typography>
        </Stack>
      ) : (
        <Button size="small" variant="outlined" disabled={isAdding} onClick={handleAdd}>
          {isAdding ? <CircularProgress size={12} /> : '추가'}
        </Button>
      )}
    </Stack>
  )
}

function RoadPath({ waypoints }: { waypoints: Coordinate[] }) {
  const {
    data: { coordinates },
  } = useRoadRoute({ waypoints })

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
    <Stack gap={1.5} sx={{ padding: 16 }}>
      <Skeleton variant="rounded" height={180} />
      {[0, 1, 2].map((index) => (
        <Stack key={index} direction="row" alignItems="center" gap={1}>
          <Skeleton variant="circular" width={22} height={22} />
          <Skeleton variant="text" width="60%" />
        </Stack>
      ))}
    </Stack>
  )
}
