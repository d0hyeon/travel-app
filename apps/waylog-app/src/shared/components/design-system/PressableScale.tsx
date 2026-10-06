import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

export const PRESS_OUT_DURATION_MS = 420

const PRESS_IN = { duration: 260, easing: Easing.bezier(0.16, 1, 0.3, 1) }
const PRESS_OUT = { duration: PRESS_OUT_DURATION_MS, easing: Easing.bezier(0.34, 1.8, 0.5, 1) }

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** 누르고 있는 동안의 배율 */
  pressedScale?: number
  /** 배율과 함께 커지는 바깥 컨테이너에 적용한다 */
  style?: StyleProp<ViewStyle>
}

export function PressableScale({
  pressedScale = 1.35,
  style,
  onPressIn,
  onPressOut,
  children,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1)
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={[style, scaleStyle]}>
      <Pressable
        onPressIn={(event) => {
          scale.set(withTiming(pressedScale, PRESS_IN))
          onPressIn?.(event)
        }}
        onPressOut={(event) => {
          scale.set(withTiming(1, PRESS_OUT))
          onPressOut?.(event)
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
