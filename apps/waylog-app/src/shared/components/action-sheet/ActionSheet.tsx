import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { StyleSheet, Animated, Modal, Pressable, ScrollView } from 'react-native'
import { Text, useTheme, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// 네이티브에는 앵커 기준 팝오버가 없어 하단 시트로 띄운다.
interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const BACKDROP_DURATION = 180
const SHEET_DURATION = 220
const SHEET_OFFSET = 80
const MAX_SHEET_HEIGHT = 560

export function ActionSheet({ isOpen, onClose, children }: ActionSheetProps) {
  const theme = useTheme()
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current

  useEffect(() => {
    if (!isOpen) return

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: BACKDROP_DURATION, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 0, duration: SHEET_DURATION, useNativeDriver: true }),
    ]).start()

    return () => {
      backdropOpacity.setValue(0)
      sheetTranslateY.setValue(SHEET_OFFSET)
    }
  }, [backdropOpacity, isOpen, sheetTranslateY])
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable onPress={onClose} style={styles.backdropTarget} />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
          <View
            style={[styles.sheet, { backgroundColor: theme.surface.val }]}
          >
            <ScrollView style={styles.scrollArea} bounces={false}>
              <ActionSheetCloseContext.Provider value={onClose}>
                <View style={{ paddingBottom: insets.bottom }}>
                  {children}
                </View>
              </ActionSheetCloseContext.Provider>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const ActionSheetCloseContext = createContext<() => void>(() => { })

interface ActionSheetItemProps {
  onPress?: () => void
  icon?: ReactNode
  children?: ReactNode
  color?: 'text' | 'error'
}

ActionSheet.Item = function ActionSheetItem({ onPress, icon, children, color = 'text' }: ActionSheetItemProps) {
  const close = useContext(ActionSheetCloseContext)
  const theme = useTheme()
  const textColor = color === 'error' ? theme.danger.val : theme.onSurface.val

  return (
    <Pressable
      onPress={() => {
        close()
        requestAnimationFrame(() => onPress?.())
      }}
      style={styles.item}
    >
      <View style={styles.itemContent}>
        {icon}
        <Text
          style={[styles.itemText, { color: textColor }]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backdropTarget: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
  },
  scrollArea: {
    maxHeight: MAX_SHEET_HEIGHT,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  itemContent: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  itemText: { fontSize: 14, fontWeight: '700' },
})
