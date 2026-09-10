import { Children, isValidElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { palette, zLayer } from '../../../config/tokens'
import { MenuFabContext } from './MenuFabContext'
import { MenuFabItem } from './MenuFabItem'
import { CLOSE_DURATION_MS, FAB_SIZE, HINT_LAYERS, HINT_PRESS_DURATION_MS, LONG_PRESS_DELAY_MS, OPEN_DURATION_MS, getHintLayerOffset } from './menuFabMotion'

const HINT_HAPTIC_DELAY_MS = 100

export interface MenuFabProps {
  onPress?: () => void
  children?: ReactNode
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

function MenuFabRoot({ onPress, children, disabled = false, style }: MenuFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuProgress = useSharedValue(0)
  const pressProgress = useSharedValue(0)
  const didLongPress = useRef(false)
  const hapticTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const items = Children.toArray(children)
  const itemCount = items.length
  const isMenuInteractive = isOpen && !disabled

  const cancelHintHaptic = useCallback(() => {
    clearTimeout(hapticTimer.current)
    hapticTimer.current = undefined
  }, [])

  useEffect(() => {
    if (disabled) cancelHintHaptic()
    return cancelHintHaptic
  }, [disabled, cancelHintHaptic])

  const closeMenu = useCallback(() => {
    menuProgress.set(withTiming(0, { duration: CLOSE_DURATION_MS }))
    setIsOpen(false)
  }, [menuProgress])

  const toggleMenu = () => {
    if (disabled) return
    if (isOpen) {
      closeMenu()
      return
    }
    if (itemCount === 0) return
    setIsOpen(true)
    menuProgress.set(withTiming(1, { duration: OPEN_DURATION_MS }))
  }

  const handlePress = () => {
    if (disabled || didLongPress.current) return
    if (isOpen) {
      closeMenu()
      return
    }
    onPress?.()
  }

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.get() * 0.04 }],
  }))
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${menuProgress.get() * 45}deg` }],
  }))

  return (
    <View style={[styles.root, style]} pointerEvents="box-none">
      {isOpen && (
        <Pressable
          style={styles.overlay}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel="추가 메뉴 닫기"
        />
      )}
      <View style={styles.menuArea} pointerEvents={isMenuInteractive ? 'box-none' : 'none'}>
        {items.map((item, index) => (
          <MenuFabContext.Provider
            key={isValidElement(item) ? item.key : index}
            value={{ index, itemCount, menuProgress, isOpen: isMenuInteractive, closeMenu }}
          >
            {item}
          </MenuFabContext.Provider>
        ))}
      </View>
      <View style={styles.triggerArea} pointerEvents="box-none">
        {HINT_LAYERS.map((layer) => (
          <HintLayer key={layer.size} layer={layer} pressProgress={pressProgress} />
        ))}
        <Animated.View style={fabStyle}>
          <Pressable
            disabled={disabled}
            delayLongPress={LONG_PRESS_DELAY_MS}
            style={styles.fab}
            accessibilityRole="button"
            accessibilityLabel={isOpen ? '추가 메뉴 닫기' : '추가'}
            accessibilityHint={isOpen ? '눌러 메뉴를 닫습니다' : '길게 누르면 추가 메뉴가 열립니다'}
            accessibilityState={{ disabled, expanded: isOpen }}
            accessibilityActions={[
              { name: 'activate', label: isOpen ? '메뉴 닫기' : '추가' },
              { name: 'longpress', label: isOpen ? '메뉴 닫기' : '추가 메뉴 열기' },
            ]}
            onAccessibilityAction={({ nativeEvent }) => {
              if (disabled) return
              if (nativeEvent.actionName === 'longpress') {
                toggleMenu()
                return
              }
              if (nativeEvent.actionName === 'activate') {
                if (isOpen) closeMenu()
                else onPress?.()
              }
            }}
            onAccessibilityEscape={closeMenu}
            onPressIn={() => {
              if (disabled) return
              cancelHintHaptic()
              hapticTimer.current = setTimeout(() => {
                hapticTimer.current = undefined
                impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
              }, HINT_HAPTIC_DELAY_MS)
              didLongPress.current = false
              pressProgress.set(withTiming(1, { duration: HINT_PRESS_DURATION_MS }))
            }}
            onPressOut={() => {
              cancelHintHaptic()
              pressProgress.set(withTiming(0, { duration: 150 }))
            }}
            onLongPress={() => {
              didLongPress.current = true
              toggleMenu()
            }}
            onPress={handlePress}
          >
            <Animated.View style={iconStyle}>
              <MaterialIcons name="add" size={26} color="#fff" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  )
}

function HintLayer({ layer, pressProgress }: {
  layer: (typeof HINT_LAYERS)[number]
  pressProgress: SharedValue<number>
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = getHintLayerOffset(layer, pressProgress.get())
    return { transform: [{ translateX: offset }, { translateY: -offset }] }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.hint,
        {
          width: layer.size,
          height: layer.size,
          borderRadius: layer.size / 2,
          top: (FAB_SIZE - layer.size) / 2,
          left: (FAB_SIZE - layer.size) / 2,
          opacity: layer.opacity,
        },
        animatedStyle,
      ]}
    />
  )
}

export const MenuFab = Object.assign(MenuFabRoot, { Item: MenuFabItem })

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: zLayer.mapFab,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  menuArea: {
    ...StyleSheet.absoluteFillObject,
    right: 16,
    bottom: 16,
    zIndex: zLayer.mapFabMenu,
  },
  triggerArea: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: zLayer.mapFab,
  },
  hint: {
    position: 'absolute',
    backgroundColor: palette.primary,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})
