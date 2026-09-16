import { MaterialIcons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import { Dimensions, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOverlay } from '../../../shared/hooks/useOverlay'

// 탑승 시 즉시 열람이 목적이라 타이틀을 두지 않는다.
// 어두운 배경에 이미지만 남겨 밝기 조절 없이도 바코드가 읽히게 한다.
export function useTicketViewerOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (images: string[]) => {
      overlay.open(({ isOpen, close }) => (
        <TicketViewer images={images} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { open }
}

interface Props {
  images: string[]
  isOpen: boolean
  onClose: () => void
}

function TicketViewer({ images, isOpen, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(0)

  return (
    <Modal visible={isOpen} onRequestClose={onClose} animationType="fade" transparent={false}>
      <View style={styles.screen}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={[styles.closeButton, { top: insets.top + 8 }]}
          accessibilityLabel="닫기"
        >
          <MaterialIcons name="close" size={26} color="#fff" />
        </Pressable>

        <Pressable
          style={styles.imageArea}
          onPress={() => setIndex((prev) => (prev + 1) % images.length)}
        >
          <Image source={{ uri: images[index] }} style={styles.image} resizeMode="contain" />
        </Pressable>

        {images.length > 1 && (
          <View style={[styles.dots, { bottom: insets.bottom + 24 }]}>
            {images.map((image, dotIndex) => (
              <View key={image} style={[styles.dot, dotIndex === index && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  closeButton: { position: 'absolute', right: 12, zIndex: 1 },
  imageArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  image: { width: width - 32, height: height * 0.7 },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff' },
})
