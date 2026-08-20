import { formatCurrency, useExpensesByPlace } from '@waylog/domains/expense'
import { PlaceCategoryColorCode } from '@waylog/domains/place'
import { formatShortDate } from '@waylog/domains/utils'
import { ScrollView } from 'react-native'
import { ListItem } from '../../../shared/components/ListItem'
import { Box, Stack, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'

interface Props {
  tripId: string
}

// 웹 RouteExpenseView.mobile 을 옮긴다.
// 일자별 경로를 따라가며 장소마다 쓴 금액을 보여준다.
export function RouteExpenseView({ tripId }: Props) {
  const {
    data: { placesByDay, tripDates, amountByPlaceId, expensesByPlaceId },
  } = useExpensesByPlace(tripId)

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {tripDates.map((date, dayIndex) => {
        const places = placesByDay[dayIndex] ?? []
        if (places.length === 0) return null

        const dayTotal = places.reduce(
          (sum, place) => sum + (amountByPlaceId.get(place.id) ?? 0),
          0,
        )

        return (
          <Stack key={date} gap={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">
                {dayIndex + 1}일차 · {formatShortDate(date)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(dayTotal)}
              </Typography>
            </Stack>

            <Stack gap={0.5}>
              {places.map((place, index) => {
                const amount = amountByPlaceId.get(place.id) ?? 0
                const count = (expensesByPlaceId.get(place.id) ?? []).length

                return (
                  <ListItem
                    key={`${place.routeId}:${place.id}`}
                    leftAddon={
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor:
                            place.category != null
                              ? PlaceCategoryColorCode[
                                  place.category as keyof typeof PlaceCategoryColorCode
                                ]
                              : palette.divider,
                        }}
                      />
                    }
                    rightAddon={
                      <Typography variant="body2">
                        {amount > 0 ? formatCurrency(amount) : '-'}
                      </Typography>
                    }
                  >
                    <ListItem.Title>
                      {index + 1}. {place.name}
                    </ListItem.Title>
                    {count > 0 && <ListItem.Text>지출 {count}건</ListItem.Text>}
                  </ListItem>
                )
              })}
            </Stack>
          </Stack>
        )
      })}
    </ScrollView>
  )
}
