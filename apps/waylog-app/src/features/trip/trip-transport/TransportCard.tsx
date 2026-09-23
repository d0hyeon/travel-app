import { TransportTypeLabel } from '@waylog/domains/modules/transport'
import {
  formatArrivalTime,
  formatDepartureTime,
  isOvernightArrival,
  type TripTransport,
} from '@waylog/domains/modules/trip-transport'
import type { AirportArrivalGuidance } from '@waylog/domains/modules/airport-arrival-guidance'
import { format as formatDate, isSameDay, isSameYear } from 'date-fns'
import { Pressable, StyleSheet, View } from 'react-native'
import { Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'
import { TransportTypeIcon } from '../../transport/TransportTypeIcon'
import { toCarrierLabel } from './transportLabel'

const EMPTY_TIME = '—'

interface Props {
  transport: TripTransport
  airportArrivalGuidance?: AirportArrivalGuidance
  onPress?: () => void
}

export function TransportCard({ transport, airportArrivalGuidance, onPress }: Props) {
  const arrivalTime = formatArrivalTime(transport)
  const carrierLabel = toCarrierLabel(transport)

  const isDiffernceArrivalDay = transport.arrivalAt != null && !isSameDay(transport.departureAt, transport.arrivalAt)

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.typeRow}>
        <TransportTypeIcon type={transport.type} size={14} color={palette.primary} />
        <Typography style={styles.typeLabel}>{TransportTypeLabel[transport.type]}</Typography>
      </View>

      <Stack direction="row" justifyContent="space-between">
        <Typography style={styles.date}>
          {formatDate(new Date(transport.departureAt), 'M월 d일')}
        </Typography>
        {isDiffernceArrivalDay && (
          <Typography style={styles.date}>
            {formatDate(new Date(transport.arrivalAt!), 'M월 d일')}
          </Typography>
        )}
      </Stack>

      <View style={styles.times}>
        <View>
          <Typography variant="h4" style={styles.time}>{formatDepartureTime(transport)}</Typography>
          <Typography style={styles.placeName} numberOfLines={1}>
            {transport.departureName}
          </Typography>
        </View>

        <View style={styles.dashedLine} />

        <View style={styles.arrivalColumn}>
          <View style={styles.arrivalTimeRow}>
            <Typography variant="h4" style={styles.time}>{arrivalTime ?? EMPTY_TIME}</Typography>
          </View>
          <Typography style={styles.placeName} numberOfLines={1}>
            {transport.arrivalName}
          </Typography>
        </View>
      </View>

      {carrierLabel != null && <Typography style={styles.carrier}>{carrierLabel}</Typography>}
      {airportArrivalGuidance != null && (
        <Typography style={styles.arrivalGuidance}>
          {formatDate(new Date(airportArrivalGuidance.recommendedArrivalAt), 'HH:mm')}까지 공항 도착을 권장해요
        </Typography>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.background,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 12, color: palette.textSecondary },
  times: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: { fontWeight: '700' },
  placeName: { fontSize: 12, color: palette.textSecondary },
  dashedLine: {
    flex: 1,
    marginHorizontal: 8,
    // 시각 텍스트 높이의 절반쯤에 걸어 두 시각을 잇는 선으로 보이게 한다.
    marginTop: 14,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.divider,
  },
  arrivalColumn: { alignItems: 'flex-end' },
  arrivalTimeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  arrivalDate: { fontSize: 11, fontWeight: '600', color: palette.textSecondary },
  carrier: { fontSize: 12, color: palette.textSecondary, marginTop: 10 },
  arrivalGuidance: { fontSize: 12, color: palette.primary, marginTop: 10 },
})
