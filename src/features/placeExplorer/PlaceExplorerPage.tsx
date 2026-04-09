import PublicIcon from '@mui/icons-material/Public'
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Suspense, useMemo, useState } from 'react'
import { getPhotosByPlaceId, photoKey } from '../photo/photo.api'
import type { Place } from '../place/place.types'
import { useTrips } from '../trip/useTrips'
import { Country, getCountryByLocation, type Country as CountryType } from '~features/location'
import { Map } from '~shared/components/Map'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { MultiSelectDropdown } from '~shared/components/MultiSelectDropdown'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { PlaceExplorerDetailBottomSheet } from './PlaceExplorerDetailBottomSheet'
import { PlaceExplorerDetailSidePanel } from './PlaceExplorerDetailSidePanel'
import { useLocationsCoordinates } from './useLocationsCoordinates'
import { useVisitedPlaces } from './useVisitedPlaces'

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

export default function PlaceExplorerPage() {
  return (
    <Suspense fallback={
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress />
      </Box>
    }>
      <Resolved />
    </Suspense>
  )
}

function Resolved() {
  const { data: trips } = useTrips()
  const isMobile = useIsMobile()

  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])
  const [showVisitLayer, setShowVisitLayer] = useState(true)

  const {
    data: { places, countries, locations },
  } = useVisitedPlaces(selectedTripIds)


  const domesticLocations = useMemo(
    () => locations.filter((item) => getCountryByLocation(item.location) === Country.한국),
    [locations],
  )
  const foreignLocations = useMemo(
    () => locations.filter((item) => getCountryByLocation(item.location) !== Country.한국),
    [locations],
  )


  const { data: coordinatesByLocation = {} } = useLocationsCoordinates(domesticLocations, 'city')

  const tripColorMap = Object.fromEntries(
    trips.map((trip, index) => [trip.id, TRIP_COLORS[index % TRIP_COLORS.length]]),
  )
  const getTripColor = (tripId: string): TripColor => tripColorMap[tripId] ?? TRIP_COLORS[0]
  const getCountryOpacity = (count: number) => {
    if (count >= 3) return 0.35
    if (count >= 2) return 0.3
    return 0.25
  }

  const getRegionOpacity = (count: number) => {
    if (count >= 5) return 0.24
    if (count >= 3) return 0.22
    if (count >= 2) return 0.2
    return 0.2
  }

  const overlay = useOverlay()

  return (
    <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box position="absolute" top={8} left={8} zIndex={10} >
        <MultiSelectDropdown
          value={selectedTripIds}
          options={trips.map((trip) => ({
            value: trip.id,
            label: trip.name,
            color: getTripColor(trip.id).marker,
          }))}
          placeholder="전체 여행"
          onChange={setSelectedTripIds}
        />
      </Box>

      <Map
        type="google"
        sx={{ width: '100%', height: '100%' }}
        autoFocus="marker"
        clustering
        clusterGridSize={60}
      >
        {showVisitLayer && (
          <Map.PolygonLayer>
            {Object.entries(countries).map(([country, count]) => (
              <Map.Region
                key={country}
                country={country as CountryType}
                color="#2a9d6f"
                opacity={getCountryOpacity(count ?? 0)}
              />
            ))}
            {domesticLocations.map((item) => {
              const coordinates = coordinatesByLocation[item.id]
              if (!coordinates) return null

              return (
                <Map.Polygon
                  key={item.id}
                  coordinates={coordinates}
                  color="#2a9d6f"
                  opacity={getRegionOpacity(item.count)}
                />
              )
            })}
            {foreignLocations.map((item) => (
              <Map.Region
                key={item.id}
                location={item.location}
                color="#2a9d6f"
                opacity={getRegionOpacity(item.count)}
              />
            ))}
          </Map.PolygonLayer>
        )}

        {places.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            color={getTripColor(place.tripId).marker}
            isSelected={false}
            onClick={() => {
              overlay.open(({ isOpen, close }) => {
                if (isMobile) {
                  return (
                    <PlaceExplorerDetailBottomSheet
                      isOpen={isOpen}
                      place={place}
                      onClose={close}
                    />
                  )
                }

                return (
                  <PlaceExplorerDetailSidePanel
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
      <Tooltip title={showVisitLayer ? '방문 국가 숨기기' : '방문 국가 표시'} placement="left">
        <IconButton
          onClick={() => setShowVisitLayer((value) => !value)}
          sx={{
            position: 'absolute',
            bottom: isMobile ? BottomNavigation.HEIGHT + 16 : 16,
            right: 16,
            zIndex: 2000,
            bgcolor: showVisitLayer ? 'primary.main' : 'background.paper',
            color: showVisitLayer ? 'primary.contrastText' : 'text.secondary',
            boxShadow: 2,
            '&:hover': {
              bgcolor: showVisitLayer ? 'primary.dark' : 'grey.100',
            },
          }}
        >
          <PublicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

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
