import { MaterialIcons } from '@expo/vector-icons'
import { AsyncBoundary } from '@waylog/react'
import {
  useTripTransportTickets,
  type TripTransportTicket,
} from '@waylog/domains/modules/trip-transport'
import { Pressable, StyleSheet, View } from 'react-native'
import { Button, Skeleton, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'
import { useTicketViewerOverlay } from './useTicketViewerOverlay'
import { useTransportTicketFormOverlay } from '../transport-ticket/useTransportTicketFormOverlay'
import { useTransportTicketUpload } from '../transport-ticket/useTransportTicketUpload'
import { TransportDetailSectionError } from '../transport-detail/TransportDetailSectionError'

interface Props {
  tripId: string
  transportId: string
}

export function TransportTicketsSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportTicketsSkeleton />}
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
    data: { transport, primaryTicket, companionTickets },
  } = useTripTransportTickets({ tripId, transportId })
  const ticketViewer = useTicketViewerOverlay()
  const ticketForm = useTransportTicketFormOverlay()
  const { upload } = useTransportTicketUpload(tripId)

  const openTicket = (ticket: TripTransportTicket) => {
    ticketViewer.open({ tripId, ticketId: ticket.id })
  }

  // 업로드가 끝날 때까지 오버레이가 열려 있어, 진행과 실패는 그쪽에서 보인다.
  const addTickets = () => {
    return ticketForm.open({
      tripId,
      type: transport.type,
      onSubmit: (tickets) => upload({ transportId, tickets }),
    })
  }

  const hasNoTicket = primaryTicket == null && companionTickets.length === 0

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Typography style={styles.title}>티켓</Typography>
        {!hasNoTicket && (
          <Button variant="text" onPress={addTickets}>
            추가
          </Button>
        )}
      </View>
      {hasNoTicket && (
        <Pressable style={styles.addTicket} onPress={addTickets}>
          <MaterialIcons name="add" size={20} color={palette.textSecondary} />
          <Typography style={styles.addTicketLabel}>탑승권 추가</Typography>
        </Pressable>
      )}
      {primaryTicket != null && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          onPress={() => openTicket(primaryTicket)}
          style={{ width: '100%' }}
        >
          내 티켓 보기
        </Button>
      )}
      {companionTickets.map(({ ticket, owner }) => (
        <Pressable key={ticket.id} style={styles.row} onPress={() => openTicket(ticket)}>
          <View style={styles.avatar}>
            <Typography style={styles.avatarText}>{owner.name.slice(0, 1)}</Typography>
          </View>
          <Typography style={styles.name}>{owner.name}</Typography>
          <MaterialIcons name="chevron-right" size={20} color={palette.textSecondary} />
        </Pressable>
      ))}
    </View>
  )
}

function TransportTicketsSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width={36} height={20} />
      <Skeleton width="100%" height={56} variant="rounded" />
      <View style={styles.row}>
        <Skeleton width={26} height={26} variant="circular" />
        <Skeleton width={72} height={18} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 8, marginTop: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700' },
  addTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.divider,
  },
  addTicketLabel: { fontSize: 14, color: palette.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#71bbc2',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  name: { flex: 1, fontSize: 14 },
})
