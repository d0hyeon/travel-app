import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { StyleSheet, type DimensionValue, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import { Box } from './Box'

export interface SkeletonProps {
  width?: DimensionValue
  height?: DimensionValue
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular'
  style?: StyleProp<ViewStyle>
}

export function Skeleton({ width = '100%', height = 16, variant = 'text', style }: SkeletonProps) {
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
      style={[
        [styles.box, { width, height, borderRadius: variant === 'circular' ? 999 : variant === 'text' ? 4 : variant === 'rounded' ? 12 : 8 }],
        style,
      ]}
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

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
})
