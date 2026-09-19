import { AsyncBoundary } from '@waylog/react'
import { useTripTransport, useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { StyleSheet, View } from 'react-native'
import { EditableText } from '../../../../shared/components/EditableText'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TransportDetailSectionError } from './TransportDetailSectionError'
import { MaterialIcons } from '@expo/vector-icons'

const OPERATIONAL_FIELDS = [
  { name: 'terminal', label: '터미널' },
  { name: 'gate', label: '게이트' },
  { name: 'seat', label: '좌석(나)' },
] as const

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
  const { transport, primaryTicket } = useTripTransportDetail({ tripId, transportId })
  const { updateTicket } = useTripTransport(tripId)

  // 값이 없는 이유가 "탑승권이 없다"면 유도는 티켓 섹션이 한다.
  // 두 섹션이 맞붙어 있어 여기서도 하면 같은 버튼이 둘 뜬다.
  if (primaryTicket == null) return null

  return (
    <View style={styles.grid} accessibilityLabel={`${transport.type} 운행 정보`}>
      {OPERATIONAL_FIELDS.map(({ name, label }) => (
        <View key={name} style={styles.card}>
          <Typography style={styles.label}>{label}</Typography>
          <EditableText
            value={primaryTicket[name] ?? ''}
            format={(value) => (value === '' ? EMPTY_PLACEHOLDER : value)}
            endIcon={primaryTicket[name] == null ? undefined : <MaterialIcons name="edit" size={12} color={palette.grey} style={{ marginRight: -12 }} />}
            onSubmit={async (value) => {
              await updateTicket({ id: primaryTicket.id, [name]: value.trim() || undefined })
            }}
            style={styles.value}
          />
        </View>
      ))}
    </View>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <View style={styles.grid}>
      {OPERATIONAL_FIELDS.map(({ name }) => (
        <View key={name} style={styles.card}>
          <Skeleton width={36} height={14} />
          <Skeleton width={28} height={20} />
        </View>
      ))}
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
