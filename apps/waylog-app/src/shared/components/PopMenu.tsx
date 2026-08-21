import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Modal, Pressable, ScrollView } from 'react-native'
import { palette, radius } from '../config/tokens'
import { Box, Stack, Typography } from './mui'
import { IconButton } from './mui/IconButton'

// 웹 PopMenu 와 같은 사용법을 유지한다.
// 네이티브에는 앵커 기준 팝오버가 없어 하단 시트로 띄운다.
interface MenuProps {
  children?: ReactNode
  items: ReactNode
  trigger?: ReactNode
}

export function PopMenu({ children, items, trigger }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const suppressTriggerRef = useRef(false)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslateY = useRef(new Animated.Value(80)).current

  useEffect(() => {
    if (!isOpen) return

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()

    return () => {
      backdropOpacity.setValue(0)
      sheetTranslateY.setValue(80)
    }
  }, [backdropOpacity, isOpen, sheetTranslateY])

  const closeMenu = () => {
    suppressTriggerRef.current = true
    setIsOpen(false)
    setTimeout(() => {
      suppressTriggerRef.current = false
    }, 250)
  }

  return (
    <>
      {trigger != null ? <Pressable onPress={() => {
        if (suppressTriggerRef.current) return
        setIsOpen(true)
      }}>{trigger}</Pressable> : (
        <IconButton size="small" onClick={() => {
          if (suppressTriggerRef.current) return
          setIsOpen(true)
        }}>
          {children ?? <Typography sx={{ fontSize: 18, color: palette.textSecondary }}>⋮</Typography>}
        </IconButton>
      )}

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeMenu}>
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
            <Pressable onPress={closeMenu} style={{ flex: 1 }} />
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
              <ScrollView style={{ maxHeight: 560 }} bounces={false}>
                <MenuCloseContext.Provider value={closeMenu}>
                  {items}
                </MenuCloseContext.Provider>
              </ScrollView>
            </Box>
          </Animated.View>
        </Box>
      </Modal>
    </>
  )
}

const MenuCloseContext = createContext<() => void>(() => { })

interface MenuItemProps {
  onClick?: () => void
  icon?: ReactNode
  children?: ReactNode
  color?: 'text' | 'error'
}

PopMenu.Item = function MenuItem({ onClick, icon, children, color = 'text' }: MenuItemProps) {
  const close = useContext(MenuCloseContext)

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
