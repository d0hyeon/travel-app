import { Box, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import { Suspense, useMemo, useState } from 'react'
import { useLocationsCoordinates } from '~features/explorer/useLocationsCoordinates'
import { Country } from '~features/location/country.model'
import { Map } from '~shared/components/Map'
import { UserTripPhotoList } from './UserTripPhotoList'
import { useUserTrips } from './useUserTrips'
import { deriveVisitedCountries, deriveVisitedLocations, type VisitedLocation } from './user-profile.utils'

const MAP_HEIGHT = 280

interface Props {
  userId: string
}

export function ProfileRecordsTab({ userId }: Props) {
  const { data: trips } = useUserTrips(userId)
  const visited = useMemo(() => deriveVisitedLocations(trips), [trips])
  const countries = useMemo(() => deriveVisitedCountries(trips), [trips])

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const selected = visited.find(v => v.location === selectedLocation) ?? null
  const domestic = useMemo(
    () => visited.filter(v => v.countryCode === Country.한국),
    [visited],
  )
  const foreign = useMemo(
    () => visited.filter(v => v.countryCode !== Country.한국),
    [visited],
  )
  const { data: domesticPolygons = {} } = useLocationsCoordinates(
    domestic.map(v => ({ id: v.location, location: v.location })),
    'city',
  )

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        px={2}
        pt={1.75}
        pb={1.25}
        divider={<Divider orientation="vertical" flexItem />}
        spacing={3}
      >
        <MetricBlock value={visited.length} label="지역" />
        <MetricBlock value={countries.size} label="나라" />
      </Stack>

      <Box height={MAP_HEIGHT} bgcolor="#EDF2F7" position="relative">
        {visited.length > 0 ? (
          <Map
            type="google"
            sx={{ width: '100%', height: '100%' }}
            autoFocus="marker"
          >
            <Map.PolygonLayer>
              {[...countries.entries()].map(([country, count]) => (
                <Map.Region
                  key={country}
                  country={country}
                  color="#2a9d6f"
                  opacity={getPolygonOpacity(count)}
                />
              ))}
              {domestic.map((v) => {
                const polygons = domesticPolygons[v.location]
                if (!polygons) return null
                return (
                  <Map.Polygon
                    key={v.location}
                    coordinates={polygons}
                    {...getRegionPolygonStyle(v.visitCount, v.location === selectedLocation)}
                  />
                )
              })}
              {foreign.map((v) => (
                <Map.Region
                  key={v.location}
                  location={v.location}
                  {...getRegionPolygonStyle(v.visitCount, v.location === selectedLocation)}
                />
              ))}
            </Map.PolygonLayer>

            {visited.map((v) => (
              <Map.Marker
                key={v.location}
                id={v.location}
                lat={v.coordinate.lat}
                lng={v.coordinate.lng}
                variant="circle"
                color={selectedLocation === v.location ? 'selected' : 'default'}
                onClick={() => setSelectedLocation(v.location)}
              />
            ))}
          </Map>
        ) : (
          <Stack alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              아직 방문 기록이 없어요
            </Typography>
          </Stack>
        )}
      </Box>

      {selected && <SelectedLocationSection location={selected} />}
    </Box>
  )
}

function getPolygonOpacity(count: number) {
  return Math.max(Math.min(count * 0.14, 0.4), 0.18)
}

function getRegionPolygonStyle(count: number, isSelected: boolean) {
  const baseColor = count >= 3 ? '#b95454' : '#2a9d6f'
  const baseOpacity = count >= 3
    ? Math.min(getPolygonOpacity(count - 2), 0.3)
    : getPolygonOpacity(count)
  return {
    color: isSelected ? '#4C84FF' : baseColor,
    opacity: isSelected ? Math.min(baseOpacity + 0.2, 0.55) : baseOpacity,
  }
}

interface MetricBlockProps {
  value: number
  label: string
}

function MetricBlock({ value, label }: MetricBlockProps) {
  return (
    <Stack alignItems="flex-start">
      <Typography >
        {value}개
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#6b6b73' }}>
        {label}
      </Typography>
    </Stack>
  )
}

interface SelectedSectionProps {
  location: VisitedLocation
}

function SelectedLocationSection({ location }: SelectedSectionProps) {
  const lastVisitLabel = formatLastVisit(location.lastVisitedAt)

  return (
    <Box px={2} pt={2} pb={1.5}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#111' }}>
          {location.location}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#9b9ba3' }}>
          {location.countryName}
        </Typography>
        <Box flex={1} />
        <Typography sx={{ fontSize: 11.5, color: '#9b9ba3' }}>
          마지막 방문 · {lastVisitLabel}
        </Typography>
      </Stack>

      {location.trips.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          이 지역의 여행 기록이 없어요
        </Typography>
      ) : (
        <Stack spacing={1}>
          {location.trips.map((trip) => (
            <Stack gap={1}>
              <Typography variant="body2">{trip.name}</Typography>
              <Suspense fallback={<CircularProgress />}>
                <UserTripPhotoList tripId={trip.id} />
              </Suspense>

            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function formatLastVisit(iso: string): string {
  const [year, month] = iso.split('-')
  return `${year}.${month}`
}
