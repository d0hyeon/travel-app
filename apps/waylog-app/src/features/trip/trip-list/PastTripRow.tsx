import { formatTripDate, getTripDuration, type Trip } from '@waylog/domains/modules/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import { Box, Chip, Stack, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { TripUnreadCountBadge } from '../trip-chat/TripUnreadCountBadge'

interface Props {
  trip: Trip
  onPress: () => void
}

export function PastTripRow({ trip, onPress }: Props) {
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)

  return (
    <Pressable onPress={onPress} accessibilityLabel={`지난 여행: ${trip.name}`}>
      <Box sx={{ position: 'relative', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', paddingVertical: 14, paddingHorizontal: 16 }}>
        <TripUnreadCountBadge tripId={trip.id} sx={{ position: 'absolute', right: -2, top: -12 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 8 }}>
          <Box sx={{ flex: 1, paddingRight: 8 }}>
            {trip.destinations.length === 1 ? (
              <Stack direction="row" alignItems="center" sx={{ gap: 6 }}>
                <DestinationChip label={trip.destinations[0]} />
                <Typography sx={{ fontSize: 14, fontWeight: '900', flexShrink: 1 }} numberOfLines={1}>{trip.name}</Typography>
              </Stack>
            ) : (
              <>
                <Typography sx={{ fontSize: 14, fontWeight: '900' }} numberOfLines={1}>{trip.name}</Typography>
                <Stack direction="row" flexWrap="wrap" sx={{ gap: 4, marginTop: 4 }}>
                  {trip.destinations.map((destination) => <DestinationChip key={destination} label={destination} />)}
                </Stack>
              </>
            )}
            <Stack direction="row" alignItems="center" gap={6} sx={{ marginTop: 8 }}>
              <Typography sx={{ color: palette.textSecondary, fontSize: 12 }}>{formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}</Typography>
              {nights > 0 && <Typography sx={{ color: palette.textSecondary, fontSize: 11 }}>{nights}박 {days}일</Typography>}
            </Stack>
          </Box>
          <MaterialIcons name="chevron-right" size={20} color={palette.textSecondary} />
        </Stack>
      </Box>
    </Pressable>
  )
}

function DestinationChip({ label }: { label: string }) {
  return <Chip label={label} size="small" sx={{ paddingVertical: 0, paddingHorizontal: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
}
