import { useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Circle, Svg } from 'react-native-svg'
import { palette } from '~shared/config/tokens'

const AnimatedSvg = Animated.createAnimatedComponent(Svg)

const STROKE_WIDTH_RATIO = 0.1
const ARC_RATIO = 0.75

export interface CircularProgressProps {
  size?: number
  color?: 'primary' | 'inherit' | (string & {})
}

function resolveStrokeColor(color: CircularProgressProps['color']) {
  if (color === 'primary') return palette.primary
  if (color === 'inherit') return palette.textSecondary
  return color ?? palette.primary
}

export function CircularProgress({ size = 40, color = 'primary' }: CircularProgressProps) {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1)
  }, [rotation])

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const strokeWidth = size * STROKE_WIDTH_RATIO
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <AnimatedSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={rotateStyle}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={resolveStrokeColor(color)}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference * ARC_RATIO} ${circumference}`}
        strokeLinecap="round"
        fill="none"
      />
    </AnimatedSvg>
  )
}
