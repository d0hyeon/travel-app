import { formatTripDate, getTripDuration, getTripProgress, type Trip } from '@waylog/domains/modules/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { differenceInDays, set, startOfToday } from 'date-fns'
import { Pressable } from 'react-native'
import { Box, Stack, Typography } from '../../../shared/components/mui'
import { TripUnreadCountBadge } from '../trip-chat/TripUnreadCountBadge'

interface Props {
  trip: Trip
  onPress: () => void
}

export function OngoingTripCard({ trip, onPress }: Props) {
  const progress = getTripProgress(trip.startDate, trip.endDate)
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)
  const currentDay = differenceInDays(startOfToday(), resetToStartOfDay(trip.startDate)) + 1

  return (
    <Pressable onPress={onPress} accessibilityLabel={`진행 중인 여행: ${trip.name}`}>
      <Box sx={{ position: 'relative', borderRadius: 20, backgroundColor: '#3A75F0', padding: 20 }}>
        <TripUnreadCountBadge
          tripId={trip.id}
          variant="outline"
          sx={{ position: 'absolute', right: -8, top: -12 }}
        />
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ gap: 8 }}>
          <Stack direction="row" alignItems="center" sx={{ gap: 8, flex: 1 }}>
            <Typography sx={{ color: '#fff', fontSize: 13 }}>{currentDay}일차</Typography>
            <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: '900', flexShrink: 1 }} numberOfLines={1}>
              {trip.name}
            </Typography>
          </Stack>
          <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </Stack>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 }}>
          {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}
          {nights > 0 && `  ·  ${nights}박 ${days}일`}
        </Typography>
        <Box sx={{ marginTop: 20 }}>
          <Box sx={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${progress}%`, borderRadius: 2, backgroundColor: '#fff' }} />
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ marginTop: 4 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{formatTripDate(trip.startDate)}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{Math.round(progress)}%</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{formatTripDate(trip.endDate)}</Typography>
          </Stack>
        </Box>
      </Box>
    </Pressable>
  )
}

function resetToStartOfDay(value: Date | string) {
  return set(value, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
}
