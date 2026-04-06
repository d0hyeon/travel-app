import { Box, Chip, CircularProgress, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { getPhotosByPlaceId, photoKey } from '../photo/photo.api'
import type { Place } from '../place/place.types'
import { useTrips } from '../trip/useTrips'
import { Map } from '~shared/components/Map'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { useAllPlaces } from './useAllPlaces'
import { PlaceDetailBottomSheet } from './PlaceDetailBottomSheet'
import { PlaceDetailSidePanel } from './PlaceDetailSidePanel'
import { useOverlay } from '~shared/hooks/useOverlay'

// 파스텔 배경색 / 진한 텍스트(마커)용 쌍
type TripColor = { bg: string; text: string; marker: string }

const TRIP_COLORS: TripColor[] = [
  { bg: '#fce8e8', text: '#b85f5f', marker: '#de6b6b' },
  { bg: '#e8f0fc', text: '#4f76c7', marker: '#5e8ff0' },
  { bg: '#e8f7ee', text: '#4c8a63', marker: '#59b47c' },
  { bg: '#fdf0e0', text: '#bc7c37', marker: '#e29a42' },
  { bg: '#f0e8fc', text: '#855dcb', marker: '#9c72e8' },
  { bg: '#e4f5f7', text: '#3f8a9d', marker: '#4cb9cf' },
  { bg: '#fce8f3', text: '#bc5f92', marker: '#df78af' },
  { bg: '#eef7e4', text: '#6f9850', marker: '#88bf5c' },
]

export default function MapPage() {
  return (
    <Suspense fallback={
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress />
      </Box>
    }>
      <MapPageResolved />
    </Suspense>
  )
}

function MapPageResolved() {
  const { data: trips } = useTrips()
  const { data: places } = useAllPlaces()
  const isMobile = useIsMobile()

  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])

  const tripColorMap: Record<string, TripColor> = Object.fromEntries(
    trips.map((trip, i) => [trip.id, TRIP_COLORS[i % TRIP_COLORS.length]])
  )

  const getTripColor = (tripId: string): TripColor => tripColorMap[tripId] ?? TRIP_COLORS[0]

  const filteredPlaces = selectedTripIds.length === 0
    ? places
    : places.filter(p => selectedTripIds.includes(p.tripId))

  const toggleTrip = (tripId: string) => {
    setSelectedTripIds(prev =>
      prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
    )
  }

  const overlay = useOverlay();

  return (
    <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* 여행 필터 */}
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          zIndex: 10,
          overflowX: 'auto',
          pt: 0.5,
          pb: 0.5,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
        zIndex={1}
      >
        {trips.map(trip => {
          const isSelected = selectedTripIds.includes(trip.id)
          return (
            <Chip
              key={trip.id}
              label={trip.name}
              size="small"
              onClick={() => toggleTrip(trip.id)}
              sx={{
                flexShrink: 0,
                fontSize: 12,
                backgroundColor: getTripColor(trip.id).bg,
                color: getTripColor(trip.id).text,
                border: 'none',
                fontWeight: isSelected ? 700 : 400,
                boxShadow: isSelected
                  ? `0 0 0 1.5px ${getTripColor(trip.id).text}`
                  : '0 1px 3px rgba(0,0,0,0.12)',
              }}
            />
          )
        })}
      </Stack>

      {/* 지도 */}
      <Map
        type="google"
        sx={{ width: '100%', height: '100%' }}
        autoFocus="marker"
        clustering
        clusterGridSize={60}
      >
        {filteredPlaces.map(place => (
          <PlaceMarker
            key={place.id}
            place={place}
            color={getTripColor(place.tripId).marker}
            isSelected={false}
            onClick={() => {
              overlay.open(({ isOpen, close }) => {
                if (isMobile) {
                  return (
                    <PlaceDetailBottomSheet
                      isOpen={isOpen}
                      place={place}
                      onClose={close}
                    />
                  )
                }
                return (
                  <PlaceDetailSidePanel
                    isOpen={isOpen}
                    place={place}
                    onClose={close}
                  />
                )
              })

            }}
          />
        ))}
      </Map>


    </Box>
  )
}

interface PlaceMarkerProps {
  place: Place
  color: string
  isSelected: boolean
  onClick: () => void
}

function PlaceMarker({ place, color, isSelected, onClick }: PlaceMarkerProps) {
  const { data: photos } = useQuery({
    queryKey: [photoKey, 'place', place.id],
    queryFn: () => getPhotosByPlaceId(place.id),
    staleTime: Infinity,
  })

  const thumbnailUrl = photos?.[0]?.url

  return (
    <Map.Marker
      id={place.id}
      lat={place.lat}
      lng={place.lng}
      label={place.name}
      color={color}
      variant={isSelected ? 'selected' : 'default'}
      thumbnailUrl={thumbnailUrl}
      onClick={onClick}
    />
  )
}
