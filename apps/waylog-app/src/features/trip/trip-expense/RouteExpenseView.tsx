import { formatByCurrencyCode, formatCurrency, useExpensesByPlace, type PlaceWithRoute } from '@waylog/domains/modules/expense'
import { formatShortDate } from '@waylog/utility'
import { useTrip, useTripPlaces, useTripRoutes } from '@waylog/domains/modules/trip'
import { PlaceCategoryColorCode } from '@waylog/domains/modules/place'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { MaterialIcons } from '@expo/vector-icons'
import { useMemo, useRef, useState } from 'react'
import { Pressable, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { Box, IconButton, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { Map, type MapRef } from '../../../shared/components/Map'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useRouteLegsPathList } from '../hooks/useRouteLegsPathList'
import { ExpenseFormDeletationActions } from './ExpenseFormDeletationActions'
import { ExpenseFormOverlayActions, useExpenseFormBottomSheet } from './useExpenseFormOverlay'
import { getRouteColor } from './routeExpenseView.utils'

interface Props {
  tripId: string
}

// 웹 RouteExpenseView.mobile 을 옮긴다.
// 일자별 경로를 지도에 그리고, 장소마다 쓴 금액을 보여준다.
export function RouteExpenseView({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { data: members } = useTripMembers(tripId)
  const { data: places } = useTripPlaces(tripId)
  const {
    data: { routes },
  } = useTripRoutes(tripId)
  const {
    data: { placesByDay, tripDates, amountByPlaceId, amongByPlaceId, expensesByPlaceId },
    create,
    update,
  } = useExpensesByPlace(tripId)

  const mapRef = useRef<MapRef>(null)
  const expenseForm = useExpenseFormBottomSheet(tripId)

  // 일자별 스크롤 연동 — 목록에서 보이는 일차를 지도 강조에 반영한다.
  // 웹은 IntersectionObserver 를 쓰지만 RN 에는 없어 섹션 위치를 재서 판정한다.
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const dayOffsetsRef = useRef<number[]>([])

  const captureDayOffset = (dayIndex: number) => (event: LayoutChangeEvent) => {
    dayOffsetsRef.current[dayIndex] = event.nativeEvent.layout.y
  }

  const syncActiveDay = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y
    const visibleDayIndex = dayOffsetsRef.current.reduce(
      (lastPassed, offset, dayIndex) => (offset <= scrollY + 24 ? dayIndex : lastPassed),
      0,
    )
    if (visibleDayIndex !== activeDayIndex) setActiveDayIndex(visibleDayIndex)
  }

  // 경로마다 도로 경로 좌표를 얻는다. 훅 호출 수가 렌더마다 바뀌지 않도록
  // 경로 목록 전체를 한 번에 넘긴다.
  const waypointsByRoute = useMemo(
    () =>
      routes.map((route) =>
        route.placeIds
          .map((placeId) => places.find((place) => place.id === placeId))
          .filter((place) => place != null)
          .map((place) => ({ lat: place.lat, lng: place.lng })),
      ),
    [routes, places],
  )
  const legsByRoute = useRouteLegsPathList(waypointsByRoute)

  // 장소에 새 지출 추가
  const addExpense = async (place: PlaceWithRoute) => {
    const values = await expenseForm.open({
      defaultValues: {
        placeId: place.id,
        description: place.name,
        date: place.date,
        splitAmong: amongByPlaceId.get(place.id),
      },
      renderActions: ({ close, submit }) => <ExpenseFormOverlayActions onCancel={close} onSubmit={submit} />,
    })
    if (values == null) return
    create(values)
  }

  // 기존 지출 수정
  const editExpense = async (place: PlaceWithRoute, expenseId: string) => {
    const expense = (expensesByPlaceId.get(place.id) ?? []).find((item) => item.id === expenseId)
    if (expense == null) return

    const values = await expenseForm.open({
      mode: 'edit',
      defaultValues: expense,
      renderActions: ({ close, submit }) => (
        <ExpenseFormDeletationActions tripId={tripId} expenseId={expenseId} onClose={close} onSubmit={submit} />
      ),
    })
    if (values == null) return
    update({ expenseId, data: values })
  }

  return (
    <Stack style={{ flex: 1 }} gap={4}>
      <Box style={{ height: 360 }}>
        <Map ref={mapRef} style={{ height: 360 }} defaultCenter={{ lat: trip.lat, lng: trip.lng }} autoFocus="path">
          {[
            // AIRMap 은 지도용이 아닌 자식을 만나면 내부 배열이 깨진다.
            // 경로와 마커를 하나의 평탄한 배열로 넘긴다.
            ...routes.flatMap((route, routeIndex) => {
              const dayIndex = tripDates.indexOf(route.scheduledDate ?? '')
              const isActiveDay = activeDayIndex === dayIndex

              return (legsByRoute[routeIndex] ?? []).map((leg, legIndex) => (
                <Map.Path
                  key={`route_${route.id}_leg_${legIndex}`}
                  coordinates={leg.coordinates}
                  strokeColor={getRouteColor(dayIndex >= 0 ? dayIndex : routeIndex)}
                  strokeWeight={isActiveDay ? 5 : 3}
                  strokeOpacity={isActiveDay ? 1 : 0.4}
                />
              ))
            }),
            ...placesByDay.flatMap((dayPlaces, dayIndex) =>
              dayPlaces.map((place) => (
                <Map.Marker
                  key={`${place.routeId}:${place.id}`}
                  lat={place.lat}
                  lng={place.lng}
                  label={`${place.orderInRoute + 1}. ${place.name}`}
                  color={
                    place.category != null
                      ? PlaceCategoryColorCode[place.category as keyof typeof PlaceCategoryColorCode]
                      : getRouteColor(dayIndex)
                  }
                  opacity={activeDayIndex === dayIndex ? 1 : 0.5}
                  onPress={() => addExpense(place)}
                />
              )),
            ),
          ]}
        </Map>
      </Box>
      <BottomSheet.ScrollView
        onScroll={syncActiveDay}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {tripDates.map((date, dayIndex) => {
          const dayPlaces = placesByDay[dayIndex] ?? []
          const dayTotal = dayPlaces.reduce((sum, place) => sum + (amountByPlaceId.get(place.id) ?? 0), 0)

          return (
            <Stack
              key={date}
              gap={1}
              onLayout={captureDayOffset(dayIndex)}
              style={{ opacity: activeDayIndex === dayIndex ? 1 : 0.5 }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="primary" style={{ fontWeight: '800' }}>
                  {dayIndex + 1}일차 · {formatShortDate(date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(dayTotal)}
                </Typography>
              </Stack>

              {dayPlaces.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  등록된 장소가 없습니다
                </Typography>
              ) : (
                <Stack gap={1}>
                  {dayPlaces.map((place) => {
                    const amount = amountByPlaceId.get(place.id) ?? 0
                    const placeExpenses = expensesByPlaceId.get(place.id) ?? []

                    return (
                      <Pressable
                        key={`${place.routeId}:${place.id}`}
                        onPress={() => mapRef.current?.panTo(place.lat, place.lng)}
                      >
                        <Box style={{ borderWidth: 1, borderColor: '#dddddd', borderRadius: 16, padding: 16 }}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Box
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: getRouteColor(dayIndex),
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography style={{ color: '#fff', fontWeight: '800' }}>
                                {place.orderInRoute + 1}
                              </Typography>
                            </Box>
                            <Typography style={{ flex: 1, fontWeight: '700' }}>{place.name}</Typography>
                            <Typography color="primary">{amount > 0 ? formatCurrency(amount) : '-'}</Typography>
                            <IconButton size="small" onPress={() => addExpense(place)}>
                              <MaterialIcons name="playlist-add" size={22} color={palette.primary} />
                            </IconButton>
                          </Stack>
                          {placeExpenses.length > 0 && (
                            <Stack gap={0.5} style={{ marginLeft: 24, marginRight: 12, paddingTop: 12 }}>
                              {placeExpenses.map((expense) => (
                                <Pressable key={expense.id} onPress={() => editExpense(place, expense.id)}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    gap={1}
                                    style={{
                                      minHeight: 48,
                                      backgroundColor: '#f5f5f5',
                                      borderWidth: 1,
                                      borderColor: '#e0e0e0',
                                      borderRadius: 24,
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                    }}
                                  >
                                    <Typography variant="body2" style={{ flex: 1 }}>
                                      {expense.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" style={{ flexShrink: 0 }}>
                                      {expense.payments
                                        .map((payment) => members.find((member) => member.id === payment.memberId)?.name)
                                        .filter(Boolean)
                                        .join(' ')}
                                    </Typography>
                                    <Typography variant="body2" style={{ flexShrink: 0 }}>
                                      +{formatByCurrencyCode(expense.totalAmount, expense.currency)}
                                    </Typography>
                                  </Stack>
                                </Pressable>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Pressable>
                    )
                  })}
                </Stack>
              )}
            </Stack>
          )
        })}
      </BottomSheet.ScrollView>
    </Stack>
  )
}
