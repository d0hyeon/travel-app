import { Children, isValidElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { palette, zLayer } from '~shared/config/tokens'
import { MenuFabContext } from './MenuFabContext'
import { MenuFabItem } from './MenuFabItem'
import { MenuFabProgressRing, type MenuFabVariant } from './MenuFabProgressRing'
import { CLOSE_DURATION_MS, FAB_SIZE, OPEN_DURATION_MS, PRESS_SCALE_DURATION_MS, LONG_PRESS_DURATION_MS, LONG_PRESS_THRESHOLD_MS, RING_PULSE_SPRING, UNFOLD_DURATION_MS, getItemRevealEndMs } from './menuFabMotion'

const STACK_LAYERS = [
  { size: FAB_SIZE, opacity: 0.3, lift: 5 },
  { size: FAB_SIZE - 6, opacity: 0.15, lift: 14 },
]

export interface MenuFabProps {
  onPress?: () => void
  children?: ReactNode
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  /** 메뉴 뒤에 깔리는 배경. 지도 위는 'colored', 흰 리스트 화면 위는 'plain'. */
  surface?: 'colored' | 'plain'
  /** 롱프레스 진행 표현. 'bouncing' 은 바깥 링이 가속하며 차올라 완료 시 펄스를 내고, 'inner' 는 안쪽 흰 링이 일정하게 차오른다. */
  variant?: MenuFabVariant
}

function MenuFabRoot({ onPress, children, disabled = false, style, surface = 'colored', variant = 'bouncing' }: MenuFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuProgress = useSharedValue(0)
  const holdProgress = useSharedValue(0)
  const ringPulse = useSharedValue(0)
  const pressProgress = useSharedValue(0)
  const didLongPress = useRef(false)
  const revealHapticTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const isBouncing = variant === 'bouncing'
  const holdEasing = isBouncing ? Easing.in(Easing.quad) : Easing.linear
  const items = Children.toArray(children)
  const itemCount = items.length
  const hasMenu = itemCount > 0
  const isMenuInteractive = isOpen && !disabled

  const cancelRevealHaptics = useCallback(() => {
    revealHapticTimers.current.forEach(clearTimeout)
    revealHapticTimers.current = []
  }, [])

  useEffect(() => {
    if (disabled) cancelRevealHaptics()
    return cancelRevealHaptics
  }, [disabled, cancelRevealHaptics])

  const closeMenu = useCallback(() => {
    menuProgress.set(withTiming(0, { duration: CLOSE_DURATION_MS }))
    holdProgress.set(withTiming(0, { duration: CLOSE_DURATION_MS }))
    setIsOpen(false)
  }, [menuProgress, holdProgress])

  const toggleMenu = () => {
    if (disabled) return
    if (isOpen) {
      closeMenu()
      return
    }
    if (!hasMenu) return
    setIsOpen(true)
    menuProgress.set(withTiming(1, { duration: OPEN_DURATION_MS }))
    holdProgress.set(withTiming(1, { duration: OPEN_DURATION_MS }))
  }

  const handlePress = () => {
    if (disabled || didLongPress.current) return
    if (isOpen) {
      closeMenu()
      return
    }
    setTimeout(() => onPress?.(), 20)
    
  }

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.get() * 0.04 }],
  }))
  const menuHintStyle = useAnimatedStyle(() => ({
    opacity: 1 - menuProgress.get(),
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
            value={{ index, itemCount, menuProgress, isOpen: isMenuInteractive, closeMenu, surface }}
          >
            {item}
          </MenuFabContext.Provider>
        ))}
      </View>
      <View style={styles.triggerArea} pointerEvents="box-none">
        <Animated.View style={[styles.menuHint, menuHintStyle]} pointerEvents="none">
          {STACK_LAYERS.map(({ size, opacity, lift }) => (
            <View
              key={lift}
              style={[
                styles.stackLayer,
                { width: size, height: size, borderRadius: size / 2, top: (FAB_SIZE - size) / 2 - lift, left: (FAB_SIZE - size) / 2, opacity },
              ]}
            />
          ))}
        </Animated.View>
        <Animated.View style={fabStyle}>
          <Pressable
            disabled={disabled}
            delayLongPress={LONG_PRESS_DURATION_MS}
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
              didLongPress.current = false
              pressProgress.set(withTiming(1, { duration: PRESS_SCALE_DURATION_MS }))
              if (isOpen || !hasMenu) return
              holdProgress.set(withTiming(1, { duration: LONG_PRESS_DURATION_MS, easing: holdEasing }))
              menuProgress.set(withDelay(LONG_PRESS_THRESHOLD_MS, withTiming(1, { duration: UNFOLD_DURATION_MS, easing: Easing.linear })))
              revealHapticTimers.current = items.map((_, index) =>
                setTimeout(() => {
                  impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
                }, LONG_PRESS_THRESHOLD_MS + getItemRevealEndMs(index, itemCount)),
              )
            }}
            onPressOut={() => {
              cancelRevealHaptics()
              pressProgress.set(withTiming(0, { duration: 150 }))
              if (isOpen || didLongPress.current) return
              menuProgress.set(withTiming(0, { duration: CLOSE_DURATION_MS }))
              holdProgress.set(withTiming(0, { duration: CLOSE_DURATION_MS }))
            }}
            onLongPress={
              hasMenu
                ? () => {
                    didLongPress.current = true
                    if (isBouncing) ringPulse.set(withSequence(withTiming(1, { duration: 80 }), withSpring(0, RING_PULSE_SPRING)))
                    toggleMenu()
                  }
                : undefined
            }
            onPress={handlePress}
          >
            <MenuFabProgressRing variant={variant} progress={holdProgress} pulse={ringPulse} />
            <Animated.View style={iconStyle}>
              <MaterialIcons name="add" size={26} color="#fff" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  )
}

export const MenuFab = Object.assign(MenuFabRoot, { Item: MenuFabItem })

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: zLayer.mapFab,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  menuArea: {
    ...StyleSheet.absoluteFill,
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
  menuHint: {
    ...StyleSheet.absoluteFill,
  },
  stackLayer: {
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
