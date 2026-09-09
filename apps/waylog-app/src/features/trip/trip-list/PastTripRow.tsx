import { formatTripDate, getTripDuration, type Trip } from '@waylog/domains/modules/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet } from 'react-native'
import { Box, Chip, Stack, Typography } from '~/shared/components/design-system'
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
      <Box style={styles.card}>
        <TripUnreadCountBadge tripId={trip.id} style={styles.unreadBadge} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" style={styles.headerRow}>
          <Box style={styles.titleArea}>
            {trip.destinations.length === 1 ? (
              <Stack direction="row" alignItems="center" style={styles.singleDestinationRow}>
                <DestinationChip label={trip.destinations[0]} />
                <Typography style={styles.tripNameInline} numberOfLines={1}>{trip.name}</Typography>
              </Stack>
            ) : (
              <>
                <Typography style={styles.tripName} numberOfLines={1}>{trip.name}</Typography>
                {trip.destinations.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" style={styles.destinationList}>
                    {trip.destinations.map((destination) => <DestinationChip key={destination} label={destination} />)}
                  </Stack>
                )}
              </>
            )}
            <Stack direction="row" alignItems="center" gap={0.75} style={styles.dateRow}>
              <Typography style={styles.dateRange}>{formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}</Typography>
              {nights > 0 && <Typography style={styles.duration}>{nights}박 {days}일</Typography>}
            </Stack>
          </Box>
          <MaterialIcons name="chevron-right" size={20} color={palette.textSecondary} />
        </Stack>
      </Box>
    </Pressable>
  )
}

function DestinationChip({ label }: { label: string }) {
  return <Chip label={label} size="small" style={styles.destinationChip} />
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unreadBadge: {
    position: 'absolute',
    right: -2,
    top: -12,
  },
  headerRow: {
    gap: 8,
  },
  titleArea: {
    flex: 1,
    paddingRight: 8,
  },
  singleDestinationRow: {
    gap: 6,
  },
  tripNameInline: {
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  tripName: {
    fontSize: 14,
    fontWeight: '900',
  },
  destinationList: {
    gap: 4,
    marginTop: 4,
  },
  dateRow: {
    marginTop: 8,
  },
  dateRange: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  duration: {
    color: palette.textSecondary,
    fontSize: 11,
  },
  destinationChip: {
    paddingVertical: 0,
    paddingHorizontal: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
})
