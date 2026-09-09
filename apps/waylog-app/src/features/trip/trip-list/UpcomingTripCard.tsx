import { formatTripDate, getDaysUntil, getTripDuration, type Trip } from '@waylog/domains/modules/trip'
import { Pressable } from 'react-native'
import { Box, Chip, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { TripUnreadCountBadge } from '../trip-chat/TripUnreadCountBadge'

interface Props {
  trip: Trip
  onPress: () => void
}

export function UpcomingTripCard({ trip, onPress }: Props) {
  const daysUntil = getDaysUntil(trip.startDate)
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)
  const cardStyle = getUpcomingCardStyle(daysUntil)
  const dDayLabel = daysUntil === 0 ? 'D-Day' : `D-${daysUntil}`

  return (
    <Pressable onPress={onPress} accessibilityLabel={`예정된 여행: ${trip.name}, ${dDayLabel}`}>
      <Box
        style={{
          position: 'relative',
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: cardStyle.backgroundColor,
          borderWidth: 1.5,
          borderStyle: cardStyle.borderStyle,
          borderColor: cardStyle.borderColor,
        }}
      >
        <TripUnreadCountBadge tripId={trip.id} style={{ position: 'absolute', right: -8, top: -12 }} />
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" style={{ gap: 8 }}>
          <Box style={{ flex: 1, paddingRight: 8 }}>
            {trip.destinations.length === 1 ? (
              <Stack direction="row" alignItems="center" style={{ gap: 6 }}>
                <DestinationChip label={trip.destinations[0]} />
                <Typography style={{ fontSize: 15, fontWeight: '900', flexShrink: 1 }} numberOfLines={1}>
                  {trip.name}
                </Typography>
              </Stack>
            ) : (
              <>
                <Typography style={{ fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{trip.name}</Typography>
                {trip.destinations.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" style={{ gap: 4, marginTop: 4 }}>
                    {trip.destinations.map((destination) => <DestinationChip key={destination} label={destination} />)}
                  </Stack>
                )}
              </>
            )}
          </Box>
          <Typography style={{ color: '#C5631A', backgroundColor: '#FFF4E6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: '900' }}>
            {dDayLabel}
          </Typography>
        </Stack>
        <Typography style={{ color: palette.textSecondary, fontSize: 13, marginTop: 8 }}>
          {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}
          {nights > 0 && `  ·  ${nights}박 ${days}일`}
        </Typography>
      </Box>
    </Pressable>
  )
}

function DestinationChip({ label }: { label: string }) {
  return <Chip label={label} size="small" style={{ paddingVertical: 1, paddingHorizontal: 2, backgroundColor: 'rgba(76,132,255,0.08)' }} />
}

function getUpcomingCardStyle(daysUntil: number) {
  const proximity = Math.min(1, Math.max(0, daysUntil / 30))
  const interpolate = (from: number, to: number) => Math.round(from + (to - from) * proximity)
  const alpha = (0.25 + (0.08 - 0.25) * proximity).toFixed(2)

  return {
    backgroundColor: `rgb(${interpolate(238, 250)},${interpolate(243, 250)},${interpolate(255, 250)})`,
    borderColor: `rgba(${interpolate(76, 0)},${interpolate(132, 0)},${interpolate(255, 0)},${alpha})`,
    borderStyle: daysUntil <= 3 ? 'solid' : daysUntil <= 10 ? 'dashed' : 'dotted',
  } as const
}
