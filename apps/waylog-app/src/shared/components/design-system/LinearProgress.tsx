import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { palette } from '../../config/tokens'
import { Box } from './Box'

export interface LinearProgressProps {
  /** 0-100 */
  value?: number
}

export function LinearProgress({ value = 0 }: LinearProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100)

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedValue}%`, { duration: 200 }),
  }))

  return (
    <Box style={{ height: 2, backgroundColor: palette.divider, borderRadius: 1 }}>
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: palette.primary,
            borderRadius: 1,
          },
          animatedFillStyle,
        ]}
      />
    </Box>
  )
}
