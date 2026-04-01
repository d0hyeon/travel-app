import AddIcon from '@mui/icons-material/Add'
import { Box, IconButton, Stack, Typography } from "@mui/material"
import { alpha, styled } from '@mui/system'
import { useRef, useState } from "react"
import { IntersectionArea } from "../../../shared/components/IntersectionArea"
import { Map, type MapRef } from "../../../shared/components/Map"
import { useRoadPath } from "../../route/road-path/useRoadPath"
import { formatDate } from "../../../shared/utils/formats"
import { formatByCurrencyCode } from "../../expense/currency"
import { formatCurrency } from "../../expense/expense.utils"
import { PlaceCategoryColorCode } from "../../place/place.types"
import { useTripMembers } from "../trip-member/useTripMembers"
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
  const mapRef = useRef<MapRef>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const { data: { routes } } = useTripRoutes(tripId)
  const { data: members } = useTripMembers(tripId)
  const { data: places } = useTripPlaces(tripId)
  const {
    data: {
      amountByPlaceId,
      amongByPlaceId,
      expensesByPlaceId,
      placesByDay,
      tripDates,
    },
    create,
    update,
  } = useExpensesByPlace(tripId);
  const { data: trip } = useTrip(tripId)
  const mapType = trip.isOverseas ? 'google' : 'kakao'

  const [activeDayIndex, setActiveDayIndex] = useState(0)

  const formBottomSheet = useExpenseFormBottomSheet(tripId);

  // 장소에 새 지출 추가
  const handleAddExpense = async (place: PlaceWithRoute) => {
    const data = await formBottomSheet.open({
      defaultValues: {
        placeId: place.id,
        description: place.name,
        splitAmong: amongByPlaceId.get(place.id),
      },
      renderActions: ({ close }) => <ExpenseFormOverlayActions onCancel={close} />
    })
    if (data == null) return;
    create(data);
  }

  // 기존 지출 수정
  const handleEditExpense = async (place: PlaceWithRoute, expenseId: string) => {
    const expenses = expensesByPlaceId.get(place.id) ?? [];
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    const data = await formBottomSheet.open({
      defaultValues: {
        placeId: place.id,
        description: expense.description,
        payments: expense.payments,
        splitAmong: expense.splitAmong,
        currency: expense.currency
      },
      renderActions: ({ close }) => (
        <ExpenseFormDeletationActions tripId={tripId} expenseId={expenseId} onClose={close} />
      )
    })
    if (data == null) return;
    update({ expenseId, data });
  }

  return (
    <Container>
      {/* Top: Map */}
      <MapSection>
        <Map
          type={mapType}
          ref={mapRef}
          defaultCenter={{ lat: trip.lat, lng: trip.lng }}
          autoFocus="path"
          height="100%"
        >
          {placesByDay.flatMap((dayPlaces, dayIndex) =>
            dayPlaces.map((place) => (
              <Map.Marker
                key={`${place.routeId}-${place.id}`}
                id={`${place.routeId}-${place.id}`}
                lat={place.lat}
                lng={place.lng}
                label={`${place.orderInRoute + 1}. ${place.name}`}
                variant={activeDayIndex === dayIndex ? 'selected' : 'disabled'}
                color={place.category ? PlaceCategoryColorCode[place.category as keyof typeof PlaceCategoryColorCode] : getRouteColor(dayIndex)}
                opacity={activeDayIndex === dayIndex ? 1 : 0.5}
                onClick={() => handleAddExpense(place)}
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
        </Map>
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
              <Stack spacing={1}>
                {placesByDay[dayIndex].map((place) => {
                  const placeExpenses = expensesByPlaceId.get(place.id) ?? []
                  const totalAmount = amountByPlaceId.get(place.id)

                  return (
                    <PlaceItem
                      key={`${place.routeId}-${place.id}`}
                      onClick={() => mapRef.current?.panTo(place.lat, place.lng)}
                    >
                      {/* 장소 헤더 */}
                      <Stack direction="row" alignItems="center" gap={1} width="100%">
                        <Dot sx={{ bgcolor: getRouteColor(dayIndex) }}>
                          {place.orderInRoute + 1}
                        </Dot>
                        <Typography variant="body2" fontWeight="medium" flex={1} noWrap>
                          {place.name}
                        </Typography>
                        {totalAmount != null && totalAmount > 0 && (
                          <Typography variant="body2" color="primary.main" fontWeight="medium" whiteSpace="nowrap">
                            {formatCurrency(totalAmount)}
                          </Typography>
                        )}
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddExpense(place)
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      {/* 지출 목록 */}
                      {placeExpenses.length > 0 && (
                        <Stack spacing={0.5} width="100%" pl={4}>
                          {placeExpenses.map((expense) => (
                            <ExpenseItem
                              key={expense.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditExpense(place, expense.id)
                              }}
                            >
                              <Typography variant="caption" flex={1} noWrap>
                                {expense.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {expense.payments.map(p => {
                                  const member = members.find(m => m.id === p.memberId)
                                  return member ? `${member.emoji}` : ''
                                }).join(' ')}
                              </Typography>
                              <Typography variant="caption" fontWeight="medium">
                                {formatByCurrencyCode(expense.totalAmount, expense.currency)}
                              </Typography>
                            </ExpenseItem>
                          ))}
                        </Stack>
                      )}
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
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)'
})

const PlaceItem = styled(Stack)(() => ({
  flexDirection: 'column',
  padding: '10px 12px',
  cursor: 'pointer',
  border: '1px solid #ddd',
  borderRadius: 10,
  transition: 'background-color 0.2s',
  gap: 8,
  // '&:hover': {
  //   backgroundColor: theme.palette.action.hover,
  // },
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

const ExpenseItem = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  borderRadius: 16,
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${alpha(theme.palette.divider, 0.07)}`,
  // boxShadow: '0px 2px 6px #ddd',
  cursor: 'pointer',

}))

interface RoutePathProps {
  waypoints: { lat: number; lng: number }[];
  color: string
  isActive: boolean
}

function RoutePath({ waypoints, color, isActive }: RoutePathProps) {
  const coordinates = useRoadPath({ waypoints })

  if (!coordinates || coordinates.length < 2) return null

  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
