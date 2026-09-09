import { formatTripDate, getTripDuration, getTripProgress, type Trip } from '@waylog/domains/modules/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { differenceInDays, set, startOfToday } from 'date-fns'
import { Pressable, StyleSheet } from 'react-native'
import { Box, Stack, Typography } from '~/shared/components/design-system'
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
      <Box style={styles.card}>
        <TripUnreadCountBadge
          tripId={trip.id}
          variant="outline"
          style={styles.unreadBadge}
        />
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" style={styles.headerRow}>
          <Stack direction="row" alignItems="center" style={styles.dayLabelRow}>
            <Typography style={styles.dayLabel}>{currentDay}일차</Typography>
            <Typography style={styles.tripName} numberOfLines={1}>
              {trip.name}
            </Typography>
          </Stack>
          <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </Stack>
        <Typography style={styles.dateRange}>
          {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}
          {nights > 0 && `  ·  ${nights}박 ${days}일`}
        </Typography>
        <Box style={styles.progressArea}>
          <Box style={styles.progressTrack}>
            <Box style={[styles.progressFill, { width: `${progress}%` }]} />
          </Box>
          <Stack direction="row" justifyContent="space-between" style={styles.progressLabelRow}>
            <Typography style={styles.progressLabel}>{formatTripDate(trip.startDate)}</Typography>
            <Typography style={styles.progressLabel}>{Math.round(progress)}%</Typography>
            <Typography style={styles.progressLabel}>{formatTripDate(trip.endDate)}</Typography>
          </Stack>
        </Box>
      </Box>
    </Pressable>
  )
}

function resetToStartOfDay(value: Date | string) {
  return set(value, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 20,
    backgroundColor: '#3A75F0',
    padding: 20,
  },
  unreadBadge: {
    position: 'absolute',
    right: -8,
    top: -12,
  },
  headerRow: {
    gap: 8,
  },
  dayLabelRow: {
    gap: 8,
    flex: 1,
  },
  dayLabel: {
    color: '#fff',
    fontSize: 13,
  },
  tripName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    flexShrink: 1,
  },
  dateRange: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
  },
  progressArea: {
    marginTop: 20,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  progressLabelRow: {
    marginTop: 4,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
})
