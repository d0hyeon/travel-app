import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { Animated, Modal, Pressable, ScrollView } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { Box, Stack, Typography } from '../mui'
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
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current

  useEffect(() => {
    if (!isOpen) return
    console.log(1)

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: BACKDROP_DURATION, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 0, duration: SHEET_DURATION, useNativeDriver: true }),
    ]).start()

    return () => {
      backdropOpacity.setValue(0)
      sheetTranslateY.setValue(SHEET_OFFSET)
    }
  }, [backdropOpacity, isOpen, sheetTranslateY])
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <Box sx={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: backdropOpacity,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <Pressable onPress={onClose} style={{ flex: 1 }} />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
          <Box
            sx={{
              backgroundColor: palette.background,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingVertical: 8,
            }}
          >
            <ScrollView style={{ maxHeight: MAX_SHEET_HEIGHT }} bounces={false}>
              <ActionSheetCloseContext.Provider value={onClose}>
                <Box sx={{ paddingBottom: insets.bottom, }}>
                  {children}
                </Box>
              </ActionSheetCloseContext.Provider>
            </ScrollView>
          </Box>
        </Animated.View>
      </Box>
    </Modal>
  )
}

const ActionSheetCloseContext = createContext<() => void>(() => { })

interface ActionSheetItemProps {
  onClick?: () => void
  icon?: ReactNode
  children?: ReactNode
  color?: 'text' | 'error'
}

ActionSheet.Item = function ActionSheetItem({ onClick, icon, children, color = 'text' }: ActionSheetItemProps) {
  const close = useContext(ActionSheetCloseContext);

  return (
    <Pressable
      onPress={() => {
        close()
        onClick?.()
      }}
      style={{ paddingHorizontal: 20, paddingVertical: 14 }}
    >
      <Stack direction="row" gap={1} alignItems="center">
        {icon}
        <Typography
          variant="body1"
          sx={{ color: color === 'error' ? '#d32f2f' : palette.text }}
        >
          {children}
        </Typography>
      </Stack>
    </Pressable>
  )
}
