import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useTripUnreadMessageCount } from '@waylog/domains/modules/trip-chat'
import { Suspense, useEffect } from 'react'
import { Typography } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import type { StyleProp, ViewStyle } from 'react-native'

interface Props {
  tripId: string
  variant?: 'fill' | 'outline'
  style?: StyleProp<ViewStyle>
}

const POP_IN_OVERSHOOT_SCALE = 1.2
const POP_IN_GROW = { duration: 180, easing: Easing.out(Easing.cubic) }
const POP_IN_SETTLE = { duration: 120, easing: Easing.inOut(Easing.cubic) }

export function TripUnreadCountBadge(props: Props) {
  return (
    <Suspense fallback={null}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, ...badgeProps }: Props) {
  const count = useTripUnreadMessageCount(tripId)
  if (count === 0) return null

  return <PoppingBadge count={count} {...badgeProps} />
}

function PoppingBadge({ count, variant = 'fill', style }: Omit<Props, 'tripId'> & { count: number }) {
  const isFill = variant === 'fill'
  const scale = useSharedValue(0)

  useEffect(() => {
    scale.set(
      withSequence(
        withTiming(POP_IN_OVERSHOOT_SCALE, POP_IN_GROW),
        withTiming(1, POP_IN_SETTLE),
      ),
    )
  }, [])

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: isFill ? palette.primary : '#fff', borderWidth: isFill ? 0 : 1, borderColor: isFill ? undefined : palette.primary },
        style,
        popStyle,
      ]}
    >
      <Typography
        style={[styles.count, { color: isFill ? '#fff' : palette.primary }]}
      >
        {count > 99 ? '99+' : count}
      </Typography>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: 24, minHeight: 24 },
  count: { fontSize: 11, fontWeight: '700', lineHeight: 13 },
})
