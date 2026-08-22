import { formatCurrency, useExpenses, useExpensesByPlace } from '@waylog/domains/expense'
import { formatDisplayDate, formatShortDate } from '@waylog/utility'
import { useTrip } from '@waylog/domains/trip'
import { useTripMembers } from '@waylog/domains/trip-member'
import { MaterialIcons } from '@expo/vector-icons'
import { ScrollView } from 'react-native'
import { Box, IconButton, Stack, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { Map } from '../../../shared/components/Map'
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'

interface Props {
  tripId: string
}

// 웹 RouteExpenseView.mobile 을 옮긴다.
// 일자별 경로를 따라가며 장소마다 쓴 금액을 보여준다.
export function RouteExpenseView({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { create } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const expenseForm = useExpenseFormBottomSheet(tripId)
  const {
    data: { placesByDay, tripDates, amountByPlaceId, expensesByPlaceId },
  } = useExpensesByPlace(tripId)

  const routePlaces = Object.values(placesByDay).flat()

  return (
    <ScrollView contentContainerStyle={{ gap: 16 }}>
      <Box sx={{ height: 260 }}>
        <Map defaultCenter={{ lat: trip.lat, lng: trip.lng }}>
          {routePlaces.map((place) => (
            <Map.Marker key={`${place.routeId}:${place.id}`} lat={place.lat} lng={place.lng} label={place.name} />
          ))}
        </Map>
      </Box>
      <Stack sx={{ paddingHorizontal: 16 }} gap={2}>
      {tripDates.map((date, dayIndex) => {
        const places = placesByDay[dayIndex] ?? []

        const dayTotal = places.reduce(
          (sum, place) => sum + (amountByPlaceId.get(place.id) ?? 0),
          0,
        )

        return (
          <Stack key={date} gap={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: '800' }}>
                {dayIndex + 1}일차 · {formatShortDate(date)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(dayTotal)}
              </Typography>
            </Stack>

            <Stack gap={1}>
              {places.map((place, index) => {
                const amount = amountByPlaceId.get(place.id) ?? 0
                const placeExpenses = expensesByPlaceId.get(place.id) ?? []

                return (
                  <Box
                    key={`${place.routeId}:${place.id}`}
                    sx={{ borderWidth: 1, borderColor: '#dddddd', borderRadius: 16, padding: 16 }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box sx={{ width: 24, height: 24, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#fff', fontWeight: '800' }}>{index + 1}</Typography>
                      </Box>
                      <Typography sx={{ flex: 1, fontWeight: '700' }}>{place.name}</Typography>
                      <Typography color="primary">{amount > 0 ? formatCurrency(amount) : '-'}</Typography>
                      <IconButton
                        size="small"
                        onClick={async () => {
                          const values = await expenseForm.open({ defaultValues: { date: formatDisplayDate(date), placeId: place.id } })
                          if (values != null) create(values)
                        }}
                      >
                        <MaterialIcons name="playlist-add" size={22} color={palette.primary} />
                      </IconButton>
                    </Stack>
                    {placeExpenses.length > 0 && (
                      <Stack gap={0.5} sx={{ marginLeft: 24, marginRight: 12, paddingTop: 12 }}>
                        {placeExpenses.map((expense) => (
                          <Stack key={expense.id} direction="row" alignItems="center" gap={1} sx={{ minHeight: 48, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Typography variant="body2" sx={{ flex: 1 }}>{expense.description}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                              {expense.payments.map((payment) => members.find((member) => member.id === payment.memberId)?.name).filter(Boolean).join(' ')}
                            </Typography>
                            <Typography variant="body2" sx={{ flexShrink: 0 }}>+{formatCurrency(expense.totalAmount)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )
              })}
            </Stack>
          </Stack>
        )
      })}
      </Stack>
    </ScrollView>
  )
}
