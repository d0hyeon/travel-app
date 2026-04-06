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

// 파스텔 배경색 / 진한 텍스트(마커)용 쌍
type TripColor = { bg: string; text: string; marker: string }

const TRIP_COLORS: TripColor[] = [
  { bg: '#fce8e8', text: '#c07070', marker: '#e89090' },
  { bg: '#e8f0fc', text: '#6080c0', marker: '#80a0e0' },
  { bg: '#e8f7ee', text: '#608070', marker: '#80b090' },
  { bg: '#fdf0e0', text: '#c09060', marker: '#e0b070' },
  { bg: '#f0e8fc', text: '#9070c0', marker: '#b090d8' },
  { bg: '#e4f5f7', text: '#508090', marker: '#70b0c0' },
  { bg: '#fce8f3', text: '#c070a0', marker: '#e090b8' },
  { bg: '#eef7e4', text: '#708060', marker: '#98ba78' },
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
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

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
            isSelected={selectedPlace?.id === place.id}
            onClick={() => setSelectedPlace(place)}
          />
        ))}
      </Map>

      {/* 장소 상세 */}
      {selectedPlace && (
        isMobile
          ? <PlaceDetailBottomSheet
              place={selectedPlace}
              trip={trips.find(t => t.id === selectedPlace.tripId)}
              color={getTripColor(selectedPlace.tripId).marker}
              onClose={() => setSelectedPlace(null)}
            />
          : <PlaceDetailSidePanel
              place={selectedPlace}
              trip={trips.find(t => t.id === selectedPlace.tripId)}
              color={getTripColor(selectedPlace.tripId).marker}
              onClose={() => setSelectedPlace(null)}
            />
      )}
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
