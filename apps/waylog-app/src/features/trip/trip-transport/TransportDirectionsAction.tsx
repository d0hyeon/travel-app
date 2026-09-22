import { MaterialIcons } from '@expo/vector-icons'
import { AsyncBoundary } from '@waylog/react'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { Linking, Pressable, StyleSheet } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'

interface Props {
  tripId: string
  transportId: string
}

export function TransportDirectionsAction({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportDirectionsSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport } = useTripTransportDetail({ tripId, transportId })
  const departureName = transport.departureName || '-'
  return (
    <Pressable
      style={styles.action}
      onPress={() =>
        void Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(departureName)}`,
        )
      }
    >
      <MaterialIcons name="location-on" size={20} color={palette.text} />
      <Typography style={styles.label}>출발지 길찾기 · {departureName}</Typography>
      <MaterialIcons name="chevron-right" size={20} color={palette.textSecondary} />
    </Pressable>
  )
}

function TransportDirectionsSkeleton() {
  return (
    <Pressable disabled style={styles.action}>
      <Skeleton width={20} height={20} variant="circular" />
      <Skeleton width="65%" height={18} />
      <Skeleton width={20} height={20} variant="circular" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: 14,
  },
  label: { flex: 1, fontSize: 14, fontWeight: '700' },
})
