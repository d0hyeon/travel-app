import { AsyncBoundary } from '@waylog/react'
import { useFlightStatus } from '@waylog/domains/modules/flight-status'
import {
  getOperationalFields,
  useTripTransportTickets,
} from '@waylog/domains/modules/trip-transport'
import { StyleSheet, View } from 'react-native'
import { EditableText } from '../../../shared/components/EditableText'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'
import { MaterialIcons } from '@expo/vector-icons'
import { TransportType } from '@waylog/domains/modules/transport'

const EMPTY_PLACEHOLDER = '—'

interface Props {
  tripId: string
  transportId: string
}

export function TransportOperationalInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportOperationalInfoSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const {
    data: { transport, primaryTicket },
    update: updateTicket,
  } = useTripTransportTickets({ tripId, transportId })

  const { status } = useFlightStatus(transport, {
    enabled: transport.type === TransportType.항공
  })

  const fields = getOperationalFields(transport.type)

  // 값이 없는 이유가 "탑승권이 없다"면 유도는 티켓 섹션이 한다.
  // 두 섹션이 맞붙어 있어 여기서도 하면 같은 버튼이 둘 뜬다.
  if (primaryTicket == null) return null

  return (
    <View style={styles.grid} accessibilityLabel={`${transport.type} 운행 정보`}>
      {fields.map(({ name, label }) => {
        // 터미널·게이트는 항공사가 정하고 당일에도 바뀐다. 운항 정보가
        // 답한 값이 있으면 그것이 사실이므로 사용자가 적은 값을 덮고
        // 편집도 막는다. 좌석은 운항 정보가 모르는 내 티켓 정보다.
        const liveValue = name === 'seat' ? undefined : status?.[name]

        return (
          <View key={name} style={styles.card}>
            <Typography style={styles.label}>{label}</Typography>
            {liveValue == null ? (
              <EditableText
                value={primaryTicket[name] ?? ''}
                format={(value) => (value === '' ? EMPTY_PLACEHOLDER : value)}
                endIcon={primaryTicket[name] == null ? undefined : <MaterialIcons name="edit" size={12} color={palette.grey} style={{ marginRight: -12 }} />}
                onSubmit={async (value) => {
                  await updateTicket({ id: primaryTicket.id, [name]: value.trim() || undefined })
                }}
                style={styles.value}
              />
            ) : (
              <Typography style={styles.value}>{liveValue}</Typography>
            )}
          </View>
        )
      })}
    </View>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Skeleton width={36} height={14} />
        <Skeleton width={28} height={20} />
      </View>
      <View style={styles.card}>
        <Skeleton width={36} height={14} />
        <Skeleton width={28} height={20} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  label: { fontSize: 12, color: palette.textSecondary },
  value: { fontSize: 16, fontWeight: '700' },
})
