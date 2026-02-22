import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useTripPlaces } from '../trip-place/useTripPlaces'
import { useTripRoutes } from './useTripRoutes'
import { KakaoMap } from '../../../shared/components/KakaoMap'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { useRoadPath } from '../../../shared/hooks/useRoadPath'
import { PlaceSearchDialog, type PlaceSearchResult } from '../../place/place-search/PlaceSearchDialog'
import { PlaceFormDialog } from '../../place/PlaceFormDialog'
import { formatDate } from '../../../shared/utils/formats'
import { PlaceCategoryColorCode, type Place } from '../../place/place.types'
import { ListItem } from '../../../shared/components/ListItem'
import { SortableList } from '../../../shared/components/dnd/SortableList'
import { SortableItem } from '../../../shared/components/dnd/SortableItem'
import { useTripPlaceDetailOverlay } from '../trip-place/useTripPlaceDetailOverlay'
import { EditableText } from '../../../shared/components/EditableText'

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
  const {
    data: { routes, trip },
    create: createRoute,
    update,
    remove: removeRoute
  } = useTripRoutes(tripId)
  const { data: places, create: createPlace, update: updatePlace } = useTripPlaces(tripId)
  const overlay = useOverlay()

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0]
    if (today >= trip.startDate && today <= trip.endDate) {
      return today
    }
    return trip.startDate
  })
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  const dates = useMemo(() => {
    const result: string[] = []
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push(d.toISOString().split('T')[0])
    }
    return result
  }, [trip.startDate, trip.endDate])

  const routesForDate = useMemo(() => {
    return routes.filter((r) => r.scheduledDate === selectedDate)
  }, [routes, selectedDate])

  const currentRoute = useMemo(() => {
    if (selectedRouteId) {
      return routesForDate.find((r) => r.id === selectedRouteId) ?? routesForDate[0] ?? null
    }
    return routesForDate[0] ?? null
  }, [routesForDate, selectedRouteId])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedRouteId(null)
  }

  const placesUsedInOtherRoutes = useMemo(() => {
    const usedPlaceIds = new Set<string>()
    routes.forEach((route) => {
      if (route.id !== currentRoute?.id) {
        route.placeIds.forEach((id) => usedPlaceIds.add(id))
      }
    })
    return usedPlaceIds
  }, [routes, currentRoute?.id])

  // 각 경로의 waypoints를 계산
  const routeWaypointsMap = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }[]>()
    routesForDate.forEach((route) => {
      const waypoints = route.placeIds
        .map((placeId) => places.find((p) => p.id === placeId))
        .filter((p): p is Place => p != null)
        .map((place) => ({ lat: place.lat, lng: place.lng }))
      map.set(route.id, waypoints)
    })
    return map
  }, [routesForDate, places])

  const handleRemoveFromRoute = (placeId: string) => {
    if (!currentRoute) return
    const newPlaceIds = currentRoute.placeIds.filter((id) => id !== placeId)
    // placeMemos에서도 제거
    const newPlaceMemos = { ...currentRoute.placeMemos }
    delete newPlaceMemos[placeId]
    update({ routeId: currentRoute.id, data: { placeIds: newPlaceIds, placeMemos: newPlaceMemos } })
  }

  const handleEditPlaceInRoute = (place: Place) => {
    if (!currentRoute) return
    overlay.open(({ isOpen, close }) => (
      <PlaceFormDialog
        place={place}
        isOpen={isOpen}
        onClose={close}
        onSubmit={(data) => {
          // 카테고리, 태그는 장소 데이터에 저장 (경로 메모는 인라인으로 편집)
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


  const routePlaces = useMemo(() => {
    if (!currentRoute) return []
    return currentRoute.placeIds
      .map((placeId) => places.find((p) => p.id === placeId))
      .filter((p): p is Place => p != null)
  }, [currentRoute, places]);

  const detailOverlay = useTripPlaceDetailOverlay();

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
              {dates.map(x => (
                <ToggleButton
                  key={x}
                  value={x}
                  onClick={() => handleDateChange(x)}
                  size="small"
                  sx={{ paddingInline: 2 }}
                >
                  {formatDate(x)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>


            {/* 경로 선택 */}
            <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap">
              {routesForDate.map((route, index) => (
                <Chip
                  key={route.id}
                  label={`경로 ${index + 1}`}
                  variant={currentRoute?.id === route.id ? 'filled' : 'outlined'}
                  color={currentRoute?.id === route.id ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setSelectedRouteId(route.id)}
                  onDelete={() => {
                    removeRoute(route.id)
                    if (currentRoute?.id === route.id) {
                      setSelectedRouteId(null)
                    }
                  }}
                />
              ))}
              <IconButton
                size="small"
                onClick={() => {
                  createRoute({
                    tripId,
                    name: `${formatDate(selectedDate)} 경로 ${routesForDate.length + 1}`,
                    scheduledDate: selectedDate,
                  })
                }}
                color="primary"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>


            <Typography variant="subtitle2" color="text.secondary">
              {currentRoute ? `${currentRoute.name} (${routePlaces.length}개 장소)` : '경로가 없습니다'}
            </Typography>

            {routePlaces.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                지도에서 장소를 클릭하여 경로에 추가하세요
              </Typography>
            ) : (
              <Stack spacing={1}>
                <SortableList
                  items={routePlaces}
                  onSort={(changed) => {
                    update({ routeId: currentRoute.id, data: { placeIds: changed.items.map(x => x.id) } })
                  }}
                  renderItem={place => (
                    <ListItem
                      leftAddon={(
                        <SortableItem.Handle id={place.id}>
                          <DragIcon />
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
                      <ListItem.Title>{place.name}</ListItem.Title>
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
                      <RouteMemoList
                        memos={currentRoute.placeMemos[place.id] ?? []}
                        onChange={(memos) => {
                          const newPlaceMemos = { ...currentRoute.placeMemos }
                          if (memos.length > 0) {
                            newPlaceMemos[place.id] = memos
                          } else {
                            delete newPlaceMemos[place.id]
                          }
                          update({ routeId: currentRoute.id, data: { placeMemos: newPlaceMemos } })
                        }}
                      />
                      {placesUsedInOtherRoutes.has(place.id) && (
                        <ListItem.Text variant="caption" color="warning.main">
                          다른 경로에도 포함
                        </ListItem.Text>
                      )}
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
      <Box sx={{ flex: 1 }}>
        <KakaoMap
          defaultCenter={defaultCenter}
          autoFocus="path"
          height="100%"
        >
          {places.map((place) => {
            const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
            const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1

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
                    const routeNumber = routesForDate.length + 1
                    return createRoute({
                      tripId,
                      name: `${formatDate(selectedDate)} 경로 ${routeNumber}`,
                      placeIds: [place.id],
                    })
                  }
                  const newPlaceIds = isInCurrentRoute
                    ? currentRoute.placeIds.filter((id) => id !== place.id)
                    : [...currentRoute.placeIds, place.id]
                  update({ routeId: currentRoute.id, data: { placeIds: newPlaceIds } })
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
          {routesForDate.map((route, index) => (
            <RoutePath
              key={route.id}
              waypoints={routeWaypointsMap.get(route.id)}
              color={getRouteColor(index)}
              isSelected={route.id === currentRoute?.id}
            />
          ))}
        </KakaoMap>
      </Box>
    </Box>
  )
}



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

interface RouteMemoListProps {
  memos: string[]
  onChange: (memos: string[]) => void
}

function RouteMemoList({ memos, onChange }: RouteMemoListProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleUpdate = (index: number, value: string) => {
    if (!value.trim()) {
      onChange(memos.filter((_, i) => i !== index))
    } else {
      const newMemos = [...memos]
      newMemos[index] = value.trim()
      onChange(newMemos)
    }
  }

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(memos.filter((_, i) => i !== index))
  }

  return (
    <Stack gap={0.5}>
      {memos.map((memo, index) => (
        <EditableText
          key={index}
          value={memo}
          onSubmit={(value) => handleUpdate(index, value)}
          submitOnBlur
          variant="body2"
          fontSize={12}
          color="primary"
          sx={{ cursor: 'pointer' }}
          endIcon={
            <CloseIcon
              onClick={(e) => handleDelete(index, e)}
              sx={{ fontSize: 14, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'error.main' } }}
            />
          }
        />
      ))}
      {isAdding ? (
        <TextField
          autoFocus
          size="small"
          variant="standard"
          onBlur={(e) => {
            const value = e.target.value.trim()
            if (value) onChange([...memos, value])
            setIsAdding(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim()
              if (value) onChange([...memos, value])
              setIsAdding(false)
            }
            if (e.key === 'Escape') setIsAdding(false)
          }}
          placeholder="경로 메모 입력..."
          fullWidth
          slotProps={{ input: { sx: { fontSize: 12 } } }}
        />
      ) : (
        <Typography
          variant="body2"
          fontSize={12}
          color="text.secondary"
          onClick={() => setIsAdding(true)}
          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
        >
          + 경로 메모
        </Typography>
      )}
    </Stack>
  )
}