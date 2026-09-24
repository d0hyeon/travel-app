import { MaterialIcons } from '@expo/vector-icons'
import { AsyncBoundary } from '@waylog/react'
import { removeTripTransportTicket, useTripTransports } from '@waylog/domains/modules/trip-transport'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Theme } from 'tamagui'
import ConfirmDialog from '../../../../shared/components/confirm-dialog/ConfirmDialog'
import { PopMenu } from '../../../../shared/components/PopMenu'
import { useOverlay } from '../../../../shared/hooks/useOverlay'

interface OpenParams {
  tripId: string
  ticketId: string
}

// 탑승 시 즉시 열람이 목적이라 타이틀을 두지 않는다.
// 어두운 배경에 이미지만 남겨 밝기 조절 없이도 바코드가 읽히게 한다.
export function useTicketViewerOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    ({ tripId, ticketId }: OpenParams) => {
      overlay.open(({ isOpen, close }) => (
        <Modal visible={isOpen} onRequestClose={close} animationType="fade" transparent={false}>
          <View style={styles.screen}>
            <AsyncBoundary
              resetKeys={[tripId, ticketId]}
              pendingFallback={<ActivityIndicator style={styles.loading} color="#fff" />}
              rejectedFallback={() => <ViewerBar onClose={close} />}
            >
              <TicketViewer tripId={tripId} ticketId={ticketId} onClose={close} />
            </AsyncBoundary>
          </View>
        </Modal>
      ))
    },
    [overlay],
  )

  return { open }
}

interface Props {
  tripId: string
  ticketId: string
  onClose: () => void
}

function TicketViewer({ tripId, ticketId, onClose }: Props) {
  const { data: transports, refetch } = useTripTransports(tripId)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const ticket = transports
    .flatMap((transport) => transport.tickets)
    .find((item) => item.id === ticketId)

  if (ticket == null) return null

  const deleteTicket = async () => {
    setIsConfirmOpen(false)
    await removeTripTransportTicket(ticketId)
    await refetch()
    onClose()
  }

  return (
    <Theme name="dark">
      <ViewerBar onClose={onClose} onDelete={() => setIsConfirmOpen(true)} />

      <View style={styles.imageArea}>
        <Image source={{ uri: ticket.image }} style={styles.image} resizeMode="contain" />
      </View>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="탑승권을 삭제하시겠어요?"
        onConfirm={deleteTicket}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Theme>
  )
}

function ViewerBar({ onClose, onDelete }: { onClose: () => void; onDelete?: () => void }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bar, { top: insets.top + 8 }]}>
      <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="닫기">
        <MaterialIcons name="close" size={26} color="#fff" />
      </Pressable>

      {onDelete != null && (
        <PopMenu
          items={
            <PopMenu.Item
              color="error"
              icon={<MaterialIcons name="delete" size={18} color="#d32f2f" />}
              onPress={onDelete}
            >
              삭제
            </PopMenu.Item>
          }
        >
          <MaterialIcons name="more-vert" size={26} color="#fff" />
        </PopMenu>
      )}
    </View>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loading: { flex: 1 },
  imageArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  image: { width: width - 32, height: height * 0.7 },
})
