import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { StyleSheet, type LayoutChangeEvent } from 'react-native'
import { Box } from './Box'
import type { Sx } from './sx'

export interface SkeletonProps {
  width?: number | string
  height?: number | string
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular'
  sx?: Sx
}

export function Skeleton({ width = '100%', height = 16, variant = 'text', sx }: SkeletonProps) {
  const shimmerWidth = useSharedValue(0)
  const translateX = useSharedValue(0)

  const handleLayout = (event: LayoutChangeEvent) => {
    const layoutWidth = event.nativeEvent.layout.width
    if (layoutWidth <= 0) return

    shimmerWidth.set(layoutWidth)
    translateX.set(-layoutWidth)
    translateX.set(withRepeat(withTiming(layoutWidth, { duration: 1200 }), -1, false))
  }

  const animatedStyle = useAnimatedStyle(() => ({
    width: shimmerWidth.get(),
    transform: [{ translateX: translateX.get() }],
  }))

  return (
    <Box
      onLayout={handleLayout}
      sx={{
        width,
        height,
        borderRadius: variant === 'circular' ? 999 : variant === 'text' ? 4 : variant === 'rounded' ? 12 : 8,
        backgroundColor: 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
        ...(sx ?? {}),
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Box>
  )
}
