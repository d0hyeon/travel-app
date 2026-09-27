import VisibilityOnIcon from '@mui/icons-material/Visibility'
import { Box, CircularProgress, Container, Stack, ToggleButton, Typography } from '@mui/material'
import { Suspense, useMemo, useState } from 'react'
import { useLocationsCoordinates } from '~features/explorer/useLocationsCoordinates'
import { Country } from '@waylog/domains/modules/location'
import { getVisitedCountryColors, resolveVisitedCountryColor } from '@waylog/domains/modules/map'
import { Map } from '~shared/components/Map'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { useStorageState } from '~shared/hooks/useStorageState'
import { arraySplit } from '@waylog/utility'
import { UserTripPhotoList } from './UserTripPhotoList'
import { useUserTrips } from './useUserTrips'
import { deriveVisitedCountries, deriveVisitedLocations, type VisitedLocation } from './user-profile.utils'


interface Props {
  userId: string
}

export function ProfileRecordsTab({ userId }: Props) {
  const { data: trips } = useUserTrips(userId);

  const [isVisibleLocation, setIsVisibleLocation] = useIsVisibleLocation();
  const visited = useMemo(() => deriveVisitedLocations(trips), [trips])
  const countries = useMemo(() => deriveVisitedCountries(trips), [trips])
  const countryColors = useMemo(() => getVisitedCountryColors([...countries.keys()]), [countries])
  const [domestic, foreign] = useMemo(
    () => arraySplit(visited, item => item.countryCode === Country.한국),
    [visited],
  )

  const [selected, selectLocation] = useState<VisitedLocation | null>(null)

  const { data: domesticPolygons = {} } = useLocationsCoordinates(
    domestic.map(v => ({ id: v.location, location: v.location })),
    'city',
  )

  return (
    <Box>
      <Box height="calc(100svh - 40px)" bgcolor="#EDF2F7" position="relative">
        <ToggleButton
          value="check"
          aria-label="list"
          onClick={() => setIsVisibleLocation(!isVisibleLocation)}
          selected={isVisibleLocation}
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.7) !important',
            zIndex: 100
          }}
        >
          <VisibilityOnIcon fontSize="small" />
        </ToggleButton>
        {visited.length > 0 ? (
          <Map
            type="google"
            sx={{ width: '100%', height: '100%' }}
            autoFocus="marker"
            defaultZoom={1}
            clustering
          >
            <Map.PolygonLayer>
              {[...countries.entries()].map(([country, count]) => (
                <Map.Region
                  key={country}
                  country={country}
                  color={countryColors.get(country)}
                  opacity={getCountryPolygonOpacity(count)}
                />
              ))}
              {domestic.map((v) => {
                const polygons = domesticPolygons[v.location]
                if (!polygons) return null
                return (
                  <Map.Polygon
                    key={v.location}
                    coordinates={polygons}
                    {...getRegionPolygonStyle(
                      v.visitCount,
                      resolveVisitedCountryColor(countryColors, v.countryCode),
                    )}
                  />
                )
              })}
              {foreign.map((v) => (
                <Map.Region
                  key={v.location}
                  location={v.location}
                  {...getRegionPolygonStyle(
                    v.visitCount,
                    resolveVisitedCountryColor(countryColors, v.countryCode),
                  )}
                />
              ))}
            </Map.PolygonLayer>
            {isVisibleLocation && (
              <>
                {visited.map((v) => {
                  const isActived = selected?.location === v.location;

                  return (
                    <Map.Marker
                      key={v.location}
                      id={v.location}
                      lat={v.coordinate.lat}
                      lng={v.coordinate.lng}
                      variant="circle"
                      color={isActived ? 'selected' : 'default'}
                      onClick={() => isActived ? selectLocation(null) : selectLocation(v)}
                    />
                  )
                })}
              </>
            )}
          </Map>
        ) : (
          <Stack alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body2" color="text.secondary">
              아직 방문 기록이 없어요
            </Typography>
          </Stack>
        )}
      </Box>
      <BottomSheet
        isOpen={!!selected}
        snapPoints={[0.6, 0.8]}
        defaultSnapIndex={0}
        onClose={() => selectLocation(null)}
        backdrop={false}
      >
        {selected && (
          <>
            <BottomSheet.Header>
              <Container maxWidth="md">
                <LocationMetaInfo value={selected} />
              </Container>
            </BottomSheet.Header>
            <BottomSheet.Body>
              <Container maxWidth="md">
                <Stack spacing={1}>
                  {selected.trips.map((trip) => (
                    <Stack gap={1}>
                      <Typography variant="body2">{trip.name}</Typography>
                      <Suspense fallback={<CircularProgress />}>
                        <UserTripPhotoList tripId={trip.id} />
                      </Suspense>
                    </Stack>
                  ))}
                </Stack>
              </Container>
            </BottomSheet.Body>
          </>
        )}

      </BottomSheet>

    </Box>
  )
}
interface DetailViewProps {
  value: VisitedLocation;
}
function LocationMetaInfo({ value }: DetailViewProps) {
  return (
    <Stack width="100%" direction="row" alignItems="center" spacing={1} mb={1.5}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#111' }}>
        {value.location}
      </Typography>
      <Typography sx={{ fontSize: 12, color: '#9b9ba3' }}>
        {value.countryName}
      </Typography>
      <Box flex={1} />
      <Typography sx={{ fontSize: 11.5, color: '#9b9ba3' }}>
        마지막 방문 · {formatLastVisit(value.lastVisitedAt)}
      </Typography>
    </Stack>
  )
}

const MIN_VISIT_OPACITY = 0.3
const OPACITY_STEP_PER_VISIT = 0.2
const COUNTRY_MAX_VISIT_OPACITY = 0.6
const REGION_MAX_VISIT_OPACITY = 0.8

function getVisitOpacity(count: number, maxOpacity: number) {
  return Math.max(Math.min(MIN_VISIT_OPACITY + (count - 1) * OPACITY_STEP_PER_VISIT, maxOpacity), MIN_VISIT_OPACITY)
}

function getCountryPolygonOpacity(count: number) {
  return getVisitOpacity(count, COUNTRY_MAX_VISIT_OPACITY)
}

function getRegionPolygonStyle(count: number, countryColor: string) {
  return {
    color: countryColor,
    opacity: getVisitOpacity(count, REGION_MAX_VISIT_OPACITY),
  }
}


function formatLastVisit(iso: string): string {
  const [year, month] = iso.split('-')
  return `${year}.${month}`
}



function useIsVisibleLocation() {
  return useStorageState('user-record-visible-location', true, { parse: v => v === 'true' });
}
