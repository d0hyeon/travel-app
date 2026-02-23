import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Chip, IconButton, Stack, styled, Tab, Tabs, Typography } from "@mui/material";
import { useMemo } from "react";
import { useQueryParamState } from '~shared/hooks/useQueryParamState';
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog';
import { DraggableBottomSheet } from "../../../shared/components/DraggableBottomSheet";
import { KakaoMap } from "../../../shared/components/KakaoMap";
import { ListItem } from "../../../shared/components/ListItem";
import { SortableItem } from "../../../shared/components/dnd/SortableItem";
import { SortableList } from "../../../shared/components/dnd/SortableList";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { useRoadPath } from "../../../shared/hooks/useRoadPath";
import { formatDate, formatDateISO } from "../../../shared/utils/formats";
import { PlaceFormSheet } from "../../place/PlaceFormSheet";
import { PlaceCategoryColorCode, type Place } from "../../place/place.types";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { useTrip } from '../useTrip';
import { PlaceSelectSheet } from "./PlaceSelectSheet";
import { NoteEditor } from './RouteNoteList';
import { useDayTripRoutes } from './useDayTripRoutes';
import { useTripPlaceDetailOverlay } from '../trip-place/useTripPlaceDetailOverlay';

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

interface RouteContentProps {
  tripId: string;
  clusterable?: boolean
  defaultCenter: { lat: number; lng: number }
}

export function TripRoutesContent({ tripId, defaultCenter, clusterable }: RouteContentProps) {
  const overlay = useOverlay()
  const confirm = useConfirmDialog();

  const { data: trip } = useTrip(tripId)
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
    update,
    remove: removeRoute,
    updateNotes
  } = useDayTripRoutes({ tripId, date: selectedDate })
  const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string | null>('route-id', {
    defaultValue: routes?.[0]?.id ?? null
  })

  const { data: places, update: updatePlace } = useTripPlaces(tripId)

  const currentRoute = useMemo(() => {
    if (selectedRouteId) return routes.find((r) => r.id === selectedRouteId) ?? routes[0];
    return routes[0];
  }, [routes, selectedRouteId])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedRouteId(null)
  }

  const handleAddRoute = () => {
    const routeNumber = routes.length + 1
    createRoute({
      tripId,
      name: `${formatDate(selectedDate)} 경로 ${routeNumber}`,
      isMain: false,
      scheduledDate: selectedDate,
    })
  }


  const handleRemoveFromRoute = async (placeId: string) => {
    if (!currentRoute || !(await confirm('정말로 삭제하시겠어요?'))) return
    const newPlaceIds = currentRoute.placeIds.filter((id) => id !== placeId)
    update({ routeId: currentRoute.id, data: { placeIds: newPlaceIds } })
  }

  const handleEditPlaceInRoute = (place: Place) => {
    if (!currentRoute) return
    overlay.open(({ isOpen, close }) => (
      <PlaceFormSheet
        place={place}
        isOpen={isOpen}
        onClose={close}
        onSubmit={(data) => {
          // 카테고리, 태그는 장소 데이터에 저장
          updatePlace({
            placeId: place.id,
            data: {
              category: data.category || undefined,
              tags: data.tags,
            },
          })
        }}
      />
    ))
  }

  const handleAddPlacesToRoute = (placeIds: string[]) => {
    if (!currentRoute || placeIds.length === 0) return
    const newPlaceIds = [...currentRoute.placeIds, ...placeIds]
    update({ routeId: currentRoute.id, data: { placeIds: newPlaceIds } })
  }

  const { openBottomSheet: openDetailSheet } = useTripPlaceDetailOverlay();

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <KakaoMap
            defaultCenter={defaultCenter}
            autoFocus="path"
            height="100%"
            clustering={clusterable}
            clusterGridSize={50}
          >
            {places.map((place) => {
              const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
              const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1

              return (
                <KakaoMap.Marker
                  key={place.id}
                  label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                  variant={isInCurrentRoute ? 'selected' : 'disabled'}
                  color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : undefined}
                  onClick={() => openDetailSheet({ tripId, placeId: place.id })}
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

        {/* Bottom Sheet */}
        <DraggableBottomSheet
          snapPoints={[0.1, 0.5, 1]}
          defaultSnapIndex={1}
        >
          <Tabs
            value={selectedDate}
            sx={{
              position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 20,
              minHeight: 24,
              height: 40,
              overflow: "hidden",

            }}
            slotProps={{
              list: { sx: { height: '100%' } },

            }}
          >
            {tripDates.map((date) => (
              <Tab
                key={date}
                value={date}
                label={formatDate(date)}
                onClick={() => handleDateChange(date)}
                sx={{ flex: 1, minHeight: 40 }}
              />
            ))}
          </Tabs>
          <Stack gap={1} sx={{ p: 1.5 }}>
            {/* 경로 선택 & 추가 */}
            <Stack direction="row" spacing={0.5} mb={1.5} alignItems="center">
              {routes.map((route, index) => (
                <Chip
                  key={route.id}
                  label={`경로 ${index + 1}`}
                  variant={currentRoute?.id === route.id ? 'filled' : 'outlined'}
                  color={currentRoute?.id === route.id ? 'primary' : 'default'}
                  size="small"
                  sx={{ fontSize: 11 }}
                  onClick={() => setSelectedRouteId(route.id)}
                  onDelete={async () => {
                    if (await confirm('정말로 삭제하시겠어요?')) {
                      removeRoute(route.id)
                      if (currentRoute?.id === route.id) {
                        setSelectedRouteId(null)
                      }
                    }
                  }}
                />
              ))}
              <IconButton size="small" onClick={handleAddRoute} color="primary" sx={{ p: 0.5 }}>
                <AddIcon fontSize="small" />
              </IconButton>
              <Box flex={1} />
            </Stack>

            {currentRoute.places.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                지도에서 장소를 클릭하여 경로에 추가하세요
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                <SortableList
                  items={currentRoute.places}
                  onSort={(changed) => {
                    update({ routeId: currentRoute.id, data: { placeIds: changed.items.map(x => x.id) } })
                  }}
                  renderItem={(place, idx) => (
                    <ListItem
                      leftAddon={(
                        <SortableItem.Handle id={place.id}>
                          <DragIndicatorIcon />
                        </SortableItem.Handle>
                      )}
                      rightAddon={(
                        <Box flexShrink={0}>
                          <IconButton size="small" onClick={() => handleEditPlaceInRoute(place)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRemoveFromRoute(place.id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    >
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Dot>{idx + 1}</Dot>
                        <ListItem.Title>{place.name}</ListItem.Title>
                      </Stack>
                      <Box>
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
                          action="dialog"
                          marginTop={1}
                        />
                      </Box>
                    </ListItem>
                  )}
                />
              </Stack>
            )}
          </Stack>
        </DraggableBottomSheet>
      </Box>
      <Box padding={1}>
        <Button
          size="large"
          variant="contained"
          onClick={() => {
            overlay.open(({ isOpen, close }) => (
              <PlaceSelectSheet
                isOpen={isOpen}
                onClose={close}
                places={places}
                selectedPlaceIds={currentRoute?.placeIds ?? []}
                onConfirm={handleAddPlacesToRoute}
              />
            ))
          }}
          sx={{ fontSize: 12 }}
          fullWidth
          disabled={!currentRoute}
        >
          장소 추가
        </Button>
      </Box>

    </>
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
