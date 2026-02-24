import { Box, Button, Stack, Typography } from "@mui/material"
import { styled } from '@mui/system'
import { useRef, useState } from "react"
import { IntersectionArea } from "../../../shared/components/IntersectionArea"
import { KakaoMap, type KakaoMapRef } from "../../../shared/components/KakaoMap"
import { useRoadPath } from "../../../shared/hooks/useRoadPath"
import { formatDate } from "../../../shared/utils/formats"
import { formatCurrency } from "../../expense/expense.utils"
import { PlaceCategoryColorCode } from "../../place/place.types"
import { useTripMembers } from "../../trip-member/useTripMembers"
import { useTripPlaces } from "../trip-place/useTripPlaces"
import { useTripRoutes } from "../trip-route/useTripRoutes"
import { useTrip } from "../useTrip"
import { ExpenseFormDeletationActions } from "./ExpenseFormDeletationActions"
import { ExpenseFormOverlayActions, useExpenseFormBottomSheet } from "./useExpenseFormOverlay"
import { useExpensesByPlace, type PlaceWithRoute } from "./useExpensesByPlace"

const ROUTE_COLORS = [
  '#1976d2',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
]

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}

interface Props {
  tripId: string
}

export function RouteExpenseViewMobile({ tripId }: Props) {
  const mapRef = useRef<KakaoMapRef>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const { data: { routes } } = useTripRoutes(tripId)
  const { data: members } = useTripMembers(tripId)
  const { data: places } = useTripPlaces(tripId)
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
    update,
  } = useExpensesByPlace(tripId);
  const { data: { lat, lng } } = useTrip(tripId)

  const [activeDayIndex, setActiveDayIndex] = useState(0)

  const formBottomSheet = useExpenseFormBottomSheet(tripId);
  const handleOpenExpenseForm = async (place: PlaceWithRoute) => {
    const expense = expenseByPlaceId.get(place.id);

    const data = await formBottomSheet.open({
      defaultValues: {
        ...place,
        placeId: place.id,
        description: place.name,
        payments: payersByPlaceId.get(place.id),
        splitAmong: amongByPlaceId.get(place.id),
      },
      renderActions: ({ close }) => expense == null
        ? <ExpenseFormOverlayActions onCancel={close} />
        : <ExpenseFormDeletationActions tripId={tripId} expenseId={expense.id} onClose={close} />
    })
    if (data == null) return;
    if (expense == null) return create(data);
    update({ expenseId: expense.id, data })
  }

  return (
    <Container>
      {/* Top: Map */}
      <MapSection>
        <KakaoMap
          ref={mapRef}
          defaultCenter={{ lat, lng }}
          autoFocus="path"
          height="100%"
        >
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
      </MapSection>

      {/* Bottom: Place List */}
      <ListSection ref={listContainerRef}>
        {tripDates.map((date, dayIndex) => (
          <IntersectionArea
            key={date}
            root={listContainerRef.current}
            rootMargin="0px 0px -50% 0px"
            threshold={0.1}
            onEnter={() => setActiveDayIndex(dayIndex)}
            sx={{
              py: 1.5,
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
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {p.emoji} {p.name}
                              </Typography>
                              {p.amount !== placeExpense && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {p.amount.toLocaleString()}원
                                </Typography>
                              )}
                            </Stack>
                          ))}
                        </Stack>
                      )}
                      {placeExpense && (
                        <Typography variant="body2" color="primary.main" fontWeight="medium" whiteSpace="nowrap" mr={1}>
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
                        sx={{ height: 28, px: 1.5, fontSize: 12 }}
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
      </ListSection>
    </Container>
  )
}


const Container = styled(Stack)({
  height: '100%',
  flexDirection: 'column',
})

const MapSection = styled(Box)({
  height: '40%',
  minHeight: 200,
  flexShrink: 0,
})

const ListSection = styled(Box)({
  flex: 1,
  overflow: 'auto',
  padding: 12,
})

const PlaceItem = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  padding: '10px 12px',
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
  const coordinates = useRoadPath(waypoints)

  if (!coordinates || coordinates.length < 2) return null

  return (
    <KakaoMap.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
