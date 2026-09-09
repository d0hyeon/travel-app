import { StyleSheet } from 'react-native'
import { useState } from 'react'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../../config/tokens'
import { TabNavigationContext } from './TabNavigationContext'
import { TabNavigationItem } from './TabNavigationItem'
import type { TabNavigationProps } from './TabNavigation.types'

const VARIANT_TRANSITION_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
}

const HEIGHT = {
  default: 84,
  apple: 56,
} as const

export function TabNavigation({ variant, value, defaultValue, onChange, children }: TabNavigationProps) {
  const insets = useSafeAreaInsets()
  const [uncontrolledKey, setUncontrolledKey] = useState(defaultValue ?? '')
  const activeKey = value ?? uncontrolledKey

  const handleSelect = (key: string) => {
    setUncontrolledKey(key)
    onChange?.(key)
  }

  const isApple = variant === 'apple'
  const variantProgress = useDerivedValue(() => withTiming(isApple ? 1 : 0, VARIANT_TRANSITION_CONFIG))

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(variantProgress.get(), [0, 1], [HEIGHT.default, HEIGHT.apple]) + insets.bottom,
    paddingTop: interpolate(variantProgress.get(), [0, 1], [8, 6]),
    paddingBottom: insets.bottom,
    borderTopLeftRadius: interpolate(variantProgress.get(), [0, 1], [28, 0]),
    borderTopRightRadius: interpolate(variantProgress.get(), [0, 1], [28, 0]),
    borderTopWidth: interpolate(variantProgress.get(), [0, 1], [0, 0.5]),
    borderTopColor: palette.divider,
    backgroundColor: isApple ? 'rgba(255,255,255,0.4)' : palette.background,
    shadowColor: '#000',
    shadowOpacity: interpolate(variantProgress.get(), [0, 1], [0.5, 0]),
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 10,
    elevation: interpolate(variantProgress.get(), [0, 1], [12, 0]),
  }))

  const defaultGradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(variantProgress.get(), [0, 1], [1, 0]),
  }))

  return (
    <TabNavigationContext.Provider value={{ activeKey, variant, onSelect: handleSelect }}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.gradient, defaultGradientStyle]}>
          <LinearGradient
            colors={[palette.background, '#f4f5f7']}
            style={styles.gradientFill}
          />
        </Animated.View>
        {isApple && <BlurView intensity={80} tint="light" style={styles.blur} />}
        {children}
      </Animated.View>
    </TabNavigationContext.Provider>
  )
}

TabNavigation.Item = TabNavigationItem
TabNavigation.HEIGHT = HEIGHT

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  gradientFill: {
    flex: 1,
  },
  blur: {
    position: 'absolute',
    inset: 0,
  },
})
