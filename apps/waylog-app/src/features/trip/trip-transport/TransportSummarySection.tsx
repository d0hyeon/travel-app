import { AsyncBoundary } from '@waylog/react'
import { useFlightStatus } from '@waylog/domains/modules/flight-status'
import { TransportType, TransportTypeLabel } from '@waylog/domains/modules/transport'
import {
  formatArrivalTime,
  applyFlightStatus,
  formatDepartureTime,
  useTripTransportTickets,
} from '@waylog/domains/modules/trip-transport'
import { format, isSameDay } from 'date-fns'
import { StyleSheet, View, ViewProps } from 'react-native'
import { Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { TransportTypeIcon } from '../../transport/TransportTypeIcon'
import { toCarrierLabel } from './transportLabel'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'
import { MaterialIcons } from '@expo/vector-icons'

const EMPTY_VALUE = '-'

interface Props {
  tripId: string
  transportId: string
}

export function TransportSummarySection({ tripId, transportId, ...props }: Props & ViewProps) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportSummarySkeleton {...props} />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} {...props} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId, style, ...props }: Props & ViewProps) {
  const {
    data: { transport },
  } = useTripTransportTickets({ tripId, transportId })
  const carrierLabel = toCarrierLabel(transport)

  const { status } = useFlightStatus({ ...transport, transportId: transport.id }, { enabled: transport.type === TransportType.항공 })

  const scheduled = applyFlightStatus(transport, status)
  const { departureAt } = scheduled

  return (
    <View style={[styles.section, style]} {...props}>
      <View style={styles.typeBadge}>
        <TransportTypeIcon type={transport.type} size={15} color={palette.textSecondary} />
        <Typography style={styles.typeLabel}>{TransportTypeLabel[transport.type]}</Typography>
      </View>

      <View style={styles.times}>
        <Stack gap={0.5} alignItems="flex-start" justifyContent="flex-start">
          <Typography>{format(departureAt, 'M월 d일')}</Typography>
          <Typography style={styles.time}>{formatDepartureTime(scheduled) || EMPTY_VALUE}</Typography>
          <Typography variant="body1" >
            {transport.departureName || EMPTY_VALUE}
          </Typography>
        </Stack>
        <MaterialIcons name="arrow-right-alt" size={30} />
        <Stack gap={0.5} alignItems="flex-end" justifyContent="flex-start">
          {scheduled.arrivalAt != null && !isSameDay(scheduled.arrivalAt, departureAt) && (
            <Typography>{format(scheduled.arrivalAt, 'M월 d일')}</Typography>
          )}
          <Typography style={styles.time}>{formatArrivalTime(scheduled) ?? EMPTY_VALUE}</Typography>
          <Typography variant="body1" >
            {transport.arrivalName || EMPTY_VALUE}
          </Typography>
        </Stack>
      </View>

      {scheduled.arrivalDelayMinutes != null && (
        <Typography color="warning" style={styles.arrivalEstimate}>
          도착 시각은 출발 지연({scheduled.arrivalDelayMinutes}분)을 반영한 예상이에요
        </Typography>
      )}

      {carrierLabel != null && (
        <Typography style={styles.carrier} >
          {carrierLabel}
        </Typography>
      )}



    </View>
  )
}

function TransportSummarySkeleton({ style, ...props }: ViewProps) {
  return (
    <View style={[styles.section, style]} {...props}>
      <Skeleton width={64} height={28} variant="rounded" />
      <View style={styles.times}>
        <Skeleton width={72} height={38} />
        <Skeleton width={20} height={28} />
        <Skeleton width={72} height={38} />
      </View>
      <Skeleton width="72%" height={18} />
      <Skeleton width="48%" height={16} />
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  typeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginBottom: 16
  },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  times: { flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", gap: 24 },
  time: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  arrow: { fontSize: 22, lineHeight: 38, color: palette.textSecondary },
  arrivalEstimate: { fontSize: 13 },
  carrier: { marginTop: 8 },
})
