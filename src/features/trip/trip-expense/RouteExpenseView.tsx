import { Box, Button, Stack, Typography } from "@mui/material"
import { styled } from '@mui/system'
import { useRef, useState } from "react"
import { IntersectionArea } from "../../../shared/components/IntersectionArea"
import { KakaoMap, type KakaoMapRef } from "../../../shared/components/KakaoMap"
import { ResizeHandleHorizontal, useResizableSplit } from "../../../shared/hooks/useResizableSplit"
import { useRoadPath } from "../../../shared/hooks/useRoadPath"
import { formatDate } from "../../../shared/utils/formats"
import { formatCurrency } from "../../expense/expense.utils"
import { PlaceCategoryColorCode } from "../../place/place.types"
import { useTripPlaces } from "../trip-place/useTripPlaces"
import { useTripRoutes } from "../trip-route/useTripRoutes"
import { useExpenseFormOverlay } from "./useExpenseFormOverlay"
import { type PlaceWithRoute, useExpensesByPlace } from "./useExpensesByPlace"
import { useTripMembers } from "~features/trip-member/useTripMembers"

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

interface Props {
  tripId: string
  defaultCenter: { lat: number; lng: number }
}

export function RouteExpenseView({ tripId, defaultCenter }: Props) {
  const mapRef = useRef<KakaoMapRef>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const { data: { routes } } = useTripRoutes(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: places } = useTripPlaces(tripId);
  const {
    data: {
      amountByPlaceId,
      payersByPlaceId,
      amongByPlaceId,
      expenseByPlaceId,
      placesByDay,
      tripDates,
    },
    create,
    update
  } = useExpensesByPlace(tripId)

  const [activeDayIndex, setActiveDayIndex] = useState(0)

  // Resizable split panel
  const { ratio: splitRatio, containerRef, handleProps } = useResizableSplit({
    initialRatio: 50,
    onResizeEnd: () => {
      setTimeout(() => mapRef.current?.relayout?.(), 100)
    },
  })

  const expenseFormOverlay = useExpenseFormOverlay(tripId)

  const handleOpenExpenseForm = async (place: PlaceWithRoute) => {
    const data = await expenseFormOverlay.open({
      title: `${place.name} 지출 추가`,
      defaultValues: {
        ...place,
        placeId: place.id,
        description: place.name,
        payments: payersByPlaceId.get(place.id),
        splitAmong: amongByPlaceId.get(place.id),
      },
    });
    if (data == null) return;
    const expense = expenseByPlaceId.get(place.id);
    if (expense != null) {
      return update({ expenseId: expense.id, data });
    }
    create(data);
  }

  return (
    <Container ref={containerRef} direction="row">
      {/* Left: Place List */}
      <ListPanel sx={{ width: `${splitRatio}%` }}>
        <ListContainer ref={listContainerRef}>
          {tripDates.map((date, dayIndex) => (
            <IntersectionArea
              key={date}
              root={listContainerRef.current}
              rootMargin="0px 0px -50% 0px"
              // threshold={0.4}
              threshold={0.1}
              onEnter={() => setActiveDayIndex(dayIndex)}
              sx={{
                py: 2,
                opacity: activeDayIndex === dayIndex ? 1 : 0.5,
                transition: 'opacity 0.3s',
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" mb={1} color="primary">
                {dayIndex + 1}일차 · {formatDate(date)}
              </Typography>

              {placesByDay[dayIndex].length === 0 ? (
                <Typography variant="body2" color="text.secondary" py={1}>
                  등록된 장소가 없습니다
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {placesByDay[dayIndex].map((place) => {
                    const placeExpense = amountByPlaceId.get(place.id)
                    const payers = payersByPlaceId.get(place.id)
                    const amongs = amongByPlaceId
                      .get(place.id)
                      ?.map(id => members.find(x => x.id === id))
                      ?.filter(x => x != null)


                    return (
                      <PlaceItem
                        key={`${place.routeId}-${place.id}`}
                        onClick={() => mapRef.current?.panTo(place.lat, place.lng)}
                      >
                        <Dot sx={{ bgcolor: getRouteColor(dayIndex) }}>
                          {place.orderInRoute + 1}
                        </Dot>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" noWrap>
                            {place.name}
                          </Typography>
                          {amongs && amongs.length > 0 && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {amongs.map(x => `${x.emoji} ${x.name}`).join(', ')}
                            </Typography>
                          )}
                        </Box>
                        {payers && payers.length > 0 && (
                          <Stack direction="column" alignItems="stretch">
                            {payers.map(p => (
                              <Stack direction="row" key={p.memberId} justifyContent="space-between" gap={0.25}>
                                <Typography variant="caption" color="text.secondary" noWrap >
                                  {p.emoji}{' '}
                                  {p.name}
                                </Typography>
                                {p.amount !== placeExpense && (
                                  <Typography variant="caption" color="text.secondary" noWrap >
                                    {p.amount.toLocaleString()}원
                                  </Typography>
                                )}
                              </Stack>
                            ))}

                          </Stack>
                        )}
                        {placeExpense && (
                          <Typography variant="body2" color="primary.main" fontWeight="medium" whiteSpace="nowrap" sx={{ marginRight: 1 }}>
                            {formatCurrency(placeExpense)}
                          </Typography>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenExpenseForm(place)
                          }}
                          sx={{ height: 30, paddingInline: 2 }}
                        >
                          작성
                        </Button>
                      </PlaceItem>
                    )
                  })}
                </Stack>
              )}
            </IntersectionArea>
          ))}
        </ListContainer>
      </ListPanel>

      <ResizeHandleHorizontal {...handleProps} />

      <MapPanel sx={{ width: `${100 - splitRatio}%` }}>
        <KakaoMap
          ref={mapRef}
          defaultCenter={defaultCenter}
          autoFocus="path"
          height="100%"
        >
          {/* 모든 장소 마커 */}
          {placesByDay.flatMap((dayPlaces, dayIndex) =>
            dayPlaces.map((place) => (
              <KakaoMap.Marker
                key={`${place.routeId}-${place.id}`}
                id={`${place.routeId}-${place.id}`}
                lat={place.lat}
                lng={place.lng}
                label={`${place.orderInRoute + 1}. ${place.name}`}
                variant={activeDayIndex === dayIndex ? 'selected' : 'disabled'}
                color={place.category ? PlaceCategoryColorCode[place.category as keyof typeof PlaceCategoryColorCode] : getRouteColor(dayIndex)}
                opacity={activeDayIndex === dayIndex ? 1 : 0.5}
                onClick={() => handleOpenExpenseForm(place)}
              />
            ))
          )}

          {/* 모든 경로 */}
          {routes.map((route, index) => {
            const dayIndex = tripDates.indexOf(route.scheduledDate ?? '')
            const routePlaces = route.placeIds
              .map(id => places.find(p => p.id === id))
              .filter(Boolean) as { lat: number; lng: number }[]

            return (
              <RoutePath
                key={route.id}
                waypoints={routePlaces}
                color={getRouteColor(dayIndex >= 0 ? dayIndex : index)}
                isActive={activeDayIndex === dayIndex}
              />
            )
          })}
        </KakaoMap>
      </MapPanel>
    </Container>
  )
}

const Container = styled(Stack)({
  height: 480,
  overflow: 'hidden',
})

const ListPanel = styled(Stack)({
  overflow: 'hidden',
  minWidth: 200,
})

const ListContainer = styled(Box)({
  flex: 1,
  overflow: 'auto',
  padding: 12,
})

const MapPanel = styled(Stack)({
  height: '100%',
  position: 'relative',
  minWidth: 200,
})

const PlaceItem = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  padding: '12px 16px',
  cursor: 'pointer',
  border: '1px solid #ddd',
  borderRadius: 10,
  transition: 'background-color 0.2s',
  gap: 8,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const Dot = styled(Box)(({ theme }) => ({
  minWidth: 20,
  minHeight: 20,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 'bold',
  flexShrink: 0,
}))


interface RoutePathProps {
  waypoints: { lat: number; lng: number }[] | undefined
  color: string
  isActive: boolean
}

function RoutePath({ waypoints, color, isActive }: RoutePathProps) {
  const coordinates = useRoadPath(waypoints);

  if (!coordinates || coordinates.length < 2) return null;


  return (
    <KakaoMap.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
