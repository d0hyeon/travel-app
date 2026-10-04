import { MaterialIcons } from '@expo/vector-icons'
import { useCallback } from 'react'
import { Dimensions, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOverlay } from '~shared/hooks/useOverlay'

// 저장 전 드래프트를 확인만 하는 자리다. 삭제는 목록의 제거 버튼이 맡으므로
// 티켓 뷰어(식별자로 조회하고 지우는)를 쓸 수 없다 -- 아직 DB 행이 없다.
export function useTicketDraftPreviewOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (uri: string) => {
      overlay.open(({ isOpen, close }) => (
        <Modal visible={isOpen} onRequestClose={close} animationType="fade" transparent={false}>
          <TicketDraftPreview uri={uri} onClose={close} />
        </Modal>
      ))
    },
    [overlay],
  )

  return { open }
}

function TicketDraftPreview({ uri, onClose }: { uri: string; onClose: () => void }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        style={[styles.closeButton, { top: insets.top + 8 }]}
        accessibilityLabel="닫기"
      >
        <MaterialIcons name="close" size={26} color="#fff" />
      </Pressable>

      <View style={styles.imageArea}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>
    </View>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  closeButton: { position: 'absolute', left: 12, zIndex: 1 },
  imageArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  image: { width: width - 32, height: height * 0.7 },
})
