import { BlurView } from 'expo-blur'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme, useThemeName, View } from 'tamagui'
import { radius } from '../config/tokens'
import { ActionSheetCloseContext } from './action-sheet/ActionSheet'
import { resolveMenuPlacement, type Rect, type Size } from './anchoredMenu.utils'

interface AnchoredMenuProps {
  isOpen: boolean
  onClose: () => void
  anchor: Rect | null
  children: ReactNode
}

const ANCHOR_GAP = 0
const SCREEN_EDGE_MARGIN = 8
const FADE_DURATION = 120
const MENU_BLUR_INTENSITY = 40
const MENU_MAX_HEIGHT = 320

export function AnchoredMenu({ isOpen, onClose, anchor, children }: AnchoredMenuProps) {
  return (
    <Modal visible={isOpen} transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      {anchor != null && <MenuSurface anchor={anchor} onClose={onClose}>{children}</MenuSurface>}
    </Modal>
  )
}

interface MenuSurfaceProps {
  anchor: Rect
  onClose: () => void
  children: ReactNode
}

function MenuSurface({ anchor, onClose, children }: MenuSurfaceProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const blurTint = useThemeName().startsWith('dark') ? 'dark' : 'light'
  const screen = useWindowDimensions()
  const [menuSize, setMenuSize] = useState<Size | null>(null)
  const opacity = useRef(new Animated.Value(0)).current

  const bounds = {
    x: insets.left + SCREEN_EDGE_MARGIN,
    y: insets.top + SCREEN_EDGE_MARGIN,
    width: screen.width - insets.left - insets.right - SCREEN_EDGE_MARGIN * 2,
    height: screen.height - insets.top - insets.bottom - SCREEN_EDGE_MARGIN * 2,
  }
  const placement = menuSize != null
    ? resolveMenuPlacement({ anchor, menu: menuSize, bounds, gap: ANCHOR_GAP })
    : null
  const isPlaced = placement != null

  useEffect(() => {
    if (!isPlaced) return

    Animated.timing(opacity, { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }).start()
  }, [isPlaced, opacity])

  const measureMenu = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setMenuSize((measured) => measured ?? { width: layout.width, height: layout.height })
  }

  return (
    <Animated.View
      onLayout={measureMenu}
      pointerEvents={isPlaced ? 'auto' : 'none'}
      style={[
        styles.menu,
        { opacity },
        placement != null
          ? { left: placement.x, top: placement.y, maxWidth: placement.maxWidth, maxHeight: Math.min(placement.maxHeight, MENU_MAX_HEIGHT) }
          : { left: 0, top: 0, maxWidth: bounds.width, maxHeight: Math.min(bounds.height, MENU_MAX_HEIGHT) },
      ]}
    >
      <View style={[styles.clip, { backgroundColor: theme.glass.val, borderColor: theme.borderColor.val }]}>
        <BlurView
          intensity={MENU_BLUR_INTENSITY}
          tint={blurTint}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <ScrollView bounces={false}>
          <ActionSheetCloseContext.Provider value={onClose}>
            <View style={styles.items}>{children}</View>
          </ActionSheetCloseContext.Provider>
        </ScrollView>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    borderRadius: radius.xl,
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 10, color: 'rgba(0,0,0,0.1)' }],
  },
  clip: {
    flexShrink: 1,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  items: {
    paddingVertical: 4,
  },
})
