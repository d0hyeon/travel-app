import { StyleSheet } from 'react-native'
import Animated, { type SharedValue, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { palette } from '~shared/config/tokens'
import { FAB_SIZE } from './menuFabMotion'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export type MenuFabVariant = 'bouncing' | 'inner'

const STROKE_WIDTH = 3
const RING_GAP = 4
const RING_INSET = 4
const PULSE_SCALE = 0.12
const RING_OFFSET = RING_GAP + STROKE_WIDTH
const RING_SIZE = FAB_SIZE + RING_OFFSET * 2
const CENTER = RING_SIZE / 2

const RING_SPECS = {
  bouncing: { radius: FAB_SIZE / 2 + RING_GAP + STROKE_WIDTH / 2, color: palette.primary, opacity: 0.75 },
  inner: { radius: FAB_SIZE / 2 - RING_INSET, color: '#fff', opacity: 1 },
} satisfies Record<MenuFabVariant, { radius: number; color: string; opacity: number }>

interface MenuFabProgressRingProps {
  variant: MenuFabVariant
  progress: SharedValue<number>
  pulse: SharedValue<number>
}

export function MenuFabProgressRing({ variant, progress, pulse }: MenuFabProgressRingProps) {
  const { radius, color, opacity } = RING_SPECS[variant]
  const circumference = 2 * Math.PI * radius
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.get()),
    strokeOpacity: opacity + (1 - opacity) * pulse.get(),
  }))
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + PULSE_SCALE * pulse.get() }],
  }))

  return (
    <Animated.View style={[styles.ring, pulseStyle]} pointerEvents="none">
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          fill="none"
          rotation={-90}
          origin={`${CENTER}, ${CENTER}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -RING_OFFSET,
    left: -RING_OFFSET,
  },
})
