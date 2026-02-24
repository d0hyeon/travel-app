import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityOnIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import WorkspacesIcon from '@mui/icons-material/Workspaces'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { SortableItem } from '../../../shared/components/dnd/SortableItem'
import { SortableList } from '../../../shared/components/dnd/SortableList'
import { KakaoMap } from '../../../shared/components/KakaoMap'
import { ListItem } from '../../../shared/components/ListItem'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { useRoadPath } from '../../../shared/hooks/useRoadPath'
import { formatDate, formatDateISO } from '../../../shared/utils/formats'
import { PlaceSearchDialog, type PlaceSearchResult } from '../../place/place-search/PlaceSearchDialog'
import { PlaceCategoryColorCode } from '../../place/place.types'
import { useTripPlaceDetailOverlay } from '../trip-place/useTripPlaceDetailOverlay'
import { useTripPlaces } from '../trip-place/useTripPlaces'
import { useTrip } from '../useTrip'
import { NoteEditor } from './RouteNoteList'
import { useDayTripRoutes } from './useDayTripRoutes'
import { usePlaceFormOverlay } from './usePlaceFormOverlay'
import { styled } from '@mui/system'

// 경로별 색상 팔레트
const ROUTE_COLORS = [
  '#1976d2', // blue
  '#e53935', // red
  '#43a047', // green
  '#fb8c00', // orange
  '#8e24aa', // purple
  '#00acc1', // cyan
]

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}

interface TripRoutesContentProps {
  tripId: string
  defaultCenter: { lat: number; lng: number }
}

export function TripRoutesContent({ tripId, defaultCenter }: TripRoutesContentProps) {
  const overlay = useOverlay();
  const confirm = useConfirmDialog();

  const { data: trip } = useTrip(tripId);
  const [selectedDate, setSelectedDate] = useQueryParamState<string>('days', {
    defaultValue: () => {
      const today = new Date().toISOString().split('T')[0]
      if (today >= trip.startDate && today <= trip.endDate) {
        return formatDateISO(today)
      }
      return formatDateISO(trip.startDate)
    }
  })
  const {
    data: { routes, tripDates },
    create: createRoute,
    update: update,
    updateNotes,
    remove: removeRoute,
  } = useDayTripRoutes({ tripId, date: selectedDate })
  const { data: places, create: createPlace, update: updatePlace } = useTripPlaces(tripId)

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routes?.[0].id ?? null);


  const currentRoute = useMemo(() => {
    if (selectedRouteId) {
      return routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null
    }
    return routes[0] ?? null
  }, [routes, selectedRouteId])

  const { openDialog: getUpdatedPlace } = usePlaceFormOverlay();
  const detailOverlay = useTripPlaceDetailOverlay();

  const [isVisibleOtherMarkers, setIsVisibleOtherMarkers] = useQueryParamState('marker', {
    defaultValue: true,
    parse: x => x === 'true'
  })
  const [cluastering, setCluastering] = useQueryParamState('cluaster', {
    defaultValue: false,
    parse: value => value === 'true'
  })

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left: List (30%) */}
      <Stack width="30%" sx={{ borderRight: 1, borderColor: 'divider', overflow: 'auto', p: 2 }}>
        <Stack height="100%" >
          <Stack gap={2} flex="1 1 100%" paddingBottom={5}>
            {/* 날짜 선택 */}
            <ToggleButtonGroup
              color="primary"
              value={selectedDate}
              exclusive
            >
              {tripDates.map(x => (
                <ToggleButton
                  key={x}
                  value={x}
                  onClick={() => {
                    setSelectedDate(x)
                    setSelectedRouteId(null)
                  }}
                  size="small"
                  sx={{ paddingInline: 2 }}
                >
                  {formatDate(x)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>


            {/* 경로 선택 */}
            <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap">
              {routes.map((route, index) => (
                <Chip
                  key={route.id}
                  label={`경로 ${index + 1}`}
                  variant={currentRoute?.id === route.id ? 'filled' : 'outlined'}
                  color={currentRoute?.id === route.id ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setSelectedRouteId(route.id)}
                  onDelete={async () => {
                    if (await confirm('삭제하시겠어요?')) {
                      removeRoute(route.id)
                      if (currentRoute?.id === route.id) {
                        setSelectedRouteId(null)
                      }
                    }
                  }}
                />
              ))}
              <IconButton
                size="small"
                onClick={() => {
                  createRoute({
                    tripId,
                    name: `${formatDate(selectedDate)} 경로 ${routes.length + 1}`,
                    scheduledDate: selectedDate,
                  })
                }}
                color="primary"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>


            <Typography variant="subtitle2" color="text.secondary">
              {currentRoute ? `${currentRoute.name} (${currentRoute.places.length}개 장소)` : '경로가 없습니다'}
            </Typography>

            {currentRoute.places.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                지도에서 장소를 클릭하여 경로에 추가하세요
              </Typography>
            ) : (
              <Stack spacing={1}>
                <SortableList
                  items={currentRoute.places}
                  onSort={(changed) => {
                    update({ routeId: currentRoute.id, placeIds: changed.items.map(x => x.id) })
                  }}
                  renderItem={(place, idx) => (
                    <ListItem
                      leftAddon={(
                        <SortableItem.Handle id={place.id}>
                          <DragIcon />
                        </SortableItem.Handle>
                      )}
                      rightAddon={(
                        <Box flexShrink={0}>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              const updated = await getUpdatedPlace({ defaultValues: place });
                              if (updated) {
                                updatePlace({
                                  ...updated,
                                  placeId: place.id,
                                  category: updated.category || undefined, tags: updated.tags,
                                })
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (!currentRoute) return
                              const newPlaceIds = currentRoute.placeIds.filter((id) => id !== place.id)
                              update({ routeId: currentRoute.id, placeIds: newPlaceIds })
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    >

                      <ListItem.Title leftAddon={<Dot>{idx + 1}</Dot>}>
                        {place.name}
                      </ListItem.Title>
                      {place.address && (
                        <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                          {place.address}
                        </ListItem.Text>
                      )}
                      {place.memo && (
                        <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                          {place.memo}
                        </ListItem.Text>
                      )}
                      <NoteEditor
                        notes={place.routeNotes ?? []}
                        onChange={(memos) => updateNotes({ placeId: place.id, routeId: currentRoute.id, memos })}
                      />
                    </ListItem>
                  )}
                />

              </Stack>
            )}

          </Stack>
          <Box padding={1} flex="0 0 auto" position="sticky" bottom={0} sx={{ background: '#fff' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                overlay.open(({ isOpen, close }) => (
                  <PlaceSearchDialog
                    isOpen={isOpen}
                    onClose={close}
                    onSelect={(place: PlaceSearchResult) => createPlace(place)}
                  />
                ))
              }}
              fullWidth
            >
              장소 추가
            </Button>
          </Box>
        </Stack>
      </Stack>

      {/* Right: Map (70%) */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Stack gap={1} padding={1} position="absolute" top={0} left={0} zIndex={1000}>
          <ToggleButtonGroup
            orientation="vertical"
            value={isVisibleOtherMarkers}
            exclusive
            size="small"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <ToggleButton value={true} aria-label="list" onClick={() => setIsVisibleOtherMarkers(true)}>
              <VisibilityOnIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value={false} aria-label="module" onClick={() => setIsVisibleOtherMarkers(false)}>
              <VisibilityOffIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={1000}>
          <ToggleButton
            value="check"
            selected={cluastering}
            onChange={() => setCluastering(!cluastering)}
            size="small"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <WorkspacesIcon />
          </ToggleButton>
        </Stack>
        <KakaoMap
          defaultCenter={defaultCenter}
          autoFocus="path"
          height="100%"
          clustering={cluastering}
          clusterGridSize={60}
        >
          {places.map((place) => {
            const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
            const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1

            if (!isInCurrentRoute && !isVisibleOtherMarkers) {
              return null;
            }

            return (
              <KakaoMap.Marker
                key={place.id}
                label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                variant={
                  isInCurrentRoute ? 'selected' : 'disabled'
                }

                color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : undefined}
                onContextMenu={() => detailOverlay.openDialog({ placeId: place.id, tripId })}
                onClick={() => {
                  if (currentRoute == null) {
                    const routeNumber = routes.length + 1
                    return createRoute({
                      tripId,
                      name: `${formatDate(selectedDate)} 경로 ${routeNumber}`,
                      placeIds: [place.id],
                    })
                  }
                  const newPlaceIds = isInCurrentRoute
                    ? currentRoute.placeIds.filter((id) => id !== place.id)
                    : [...currentRoute.placeIds, place.id]
                  update({ routeId: currentRoute.id, placeIds: newPlaceIds })
                }}
                tooltip={[
                  place.name,
                  place.address,
                  place.memo ?? ''
                ].filter(Boolean)}

                {...place}
              />
            )
          })}
          {routes.map((route, index) => (
            <RoutePath
              key={route.id}
              waypoints={route.places}
              color={getRouteColor(index)}
              isSelected={route.id === currentRoute?.id}
            />
          ))}
        </KakaoMap>
      </Box>
    </Box>
  )
}

const Dot = styled(Box)(({ theme }) => ({
  minWidth: 18,
  minHeight: 18,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 'bold',
  flexShrink: 0,
}))



function DragIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 8.52502C21 7.97274 20.5523 7.52502 20 7.52502H4L3.88338 7.53175C3.38604 7.58952 3 8.01219 3 8.52502C3 9.07731 3.44772 9.52502 4 9.52502H20L20.1167 9.5183C20.614 9.46053 21 9.03786 21 8.52502ZM21 15.525C21 14.9728 20.5523 14.525 20 14.525H4L3.88338 14.5318C3.38604 14.5895 3 15.0122 3 15.525C3 16.0773 3.44772 16.525 4 16.525H20L20.1167 16.5183C20.614 16.4605 21 16.0379 21 15.525Z"
        fill="black"
      />
    </svg>
  )
}

interface RoutePathProps {
  waypoints: { lat: number; lng: number }[] | undefined
  color: string
  isSelected: boolean
}

function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const coordinates = useRoadPath(waypoints)

  if (!coordinates || coordinates.length < 2) return null

  return (
    <KakaoMap.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isSelected ? 5 : 3}
      strokeOpacity={isSelected ? 1 : 0.6}
    />
  )
}
