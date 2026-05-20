import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Box, CircularProgress, Stack, ToggleButton, Typography } from '@mui/material'
import { Suspense, useMemo, useState } from 'react'
import { useLocationsCoordinates } from '~features/explorer/useLocationsCoordinates'
import { Country } from '~features/location/country.model'
import { Map } from '~shared/components/Map'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { useStorageState } from '~shared/hooks/useStorageState'
import { arraySplit } from '~shared/utils/common'
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
          <VisibilityOffIcon fontSize="small" />
        </ToggleButton>
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
                    {...getRegionPolygonStyle(v.visitCount, v.location === selected?.location)}
                  />
                )
              })}
              {foreign.map((v) => (
                <Map.Region
                  key={v.location}
                  location={v.location}
                  {...getRegionPolygonStyle(v.visitCount, v.location === selected?.location)}
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
        snapPoints={[0.3, 0.5, 0.8]}
        defaultSnapIndex={1}
        onClose={() => selectLocation(null)}
        backdrop={false}
      >
        {selected && (
          <>
            <BottomSheet.Header>
              <LocationMetaInfo value={selected} />
            </BottomSheet.Header>
            <BottomSheet.Body>
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


function formatLastVisit(iso: string): string {
  const [year, month] = iso.split('-')
  return `${year}.${month}`
}



function useIsVisibleLocation() {
  return useStorageState('user-record-visible-location', true, { parse: v => v === 'true' });
}