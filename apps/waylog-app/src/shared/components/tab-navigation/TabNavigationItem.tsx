import { StyleSheet, Pressable } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'
import { palette } from '../../config/tokens'
import { useTabNavigationContext } from './TabNavigationContext'
import type { TabNavigationItemProps } from './TabNavigation.types'

const FOCUS_ANIMATION_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
}

export function TabNavigationItem({ value, label, icon }: TabNavigationItemProps) {
  const { activeKey, variant, onSelect } = useTabNavigationContext()
  const focused = activeKey === value

  const focusProgress = useDerivedValue(() => withTiming(focused ? 1 : 0, FOCUS_ANIMATION_CONFIG))

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focusProgress.get() * 0.12 }],
  }))

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(focusProgress.get(), [0, 1], [palette.grey, palette.primary]),
  }))

  return (
    <Pressable
      onPress={() => onSelect(value)}
      style={[styles.pressable, { paddingVertical: variant === 'apple' ? 0 : 8 }]}
    >
      <Animated.View style={iconStyle}>
        {icon({ color: focused ? palette.primary : palette.grey, focused })}
      </Animated.View>
      <Animated.Text style={[{ fontSize: variant === 'apple' ? 10 : 11 }, labelStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
})
