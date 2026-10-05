import Mapbox from '@rnmapbox/maps'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { formatClusterCount, resolveClusterAppearance } from './NativeMapCluster.utils'
import { useAnimatedCoordinate } from './useAnimatedCoordinate'

interface Props {
  latitude: number
  longitude: number
  count: number
  /** 다른 클러스터로 흡수되며 사라지는 중이면 그 목적지로 빨려들어간다 */
  leavingTo?: { lat: number; lng: number }
  /** 갈라져 나온 클러스터면 부모가 있던 자리에서 출발한다 */
  emergingFrom?: { lat: number; lng: number }
  /** 누르면 묶인 마커가 모두 보이도록 확대한다 */
  onTap?: () => void
}

const MIN_TOUCH_TARGET_SIZE = 56
const PRESSED_SCALE = 0.92
const LEAVE_DURATION = 300

export function NativeMapCluster({ latitude, longitude, count, leavingTo, emergingFrom, onTap }: Props) {
  const isLeaving = leavingTo != null
  const movingCoordinate = useAnimatedCoordinate(
    isLeaving ? { latitude: leavingTo.lat, longitude: leavingTo.lng } : { latitude, longitude },
    emergingFrom == null
      ? undefined
      : { latitude: emergingFrom.lat, longitude: emergingFrom.lng },
  )

  const {
    size,
    fontSize,
    background,
    textColor,
    glowColor,
    glowRadius,
    glowOpacity,
    shadowOpacity,
    shadowRadius,
    shadowOffsetY,
    elevation,
    rings = [],
  } = resolveClusterAppearance(count)

  const scale = useSharedValue(1)
  const pressedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  const leaveProgress = useSharedValue(1)
  const leavingStyle = useAnimatedStyle(() => ({ opacity: leaveProgress.get() }))

  useEffect(() => {
    if (!isLeaving) return
    leaveProgress.set(withTiming(0, { duration: LEAVE_DURATION }))
  }, [isLeaving, leaveProgress])

  const circle = (
    <View
      style={[
        styles.glow,
        toCircle(size),
        { shadowColor: glowColor, shadowOpacity: glowOpacity, shadowRadius: glowRadius, elevation },
      ]}
    >
      <View
        style={[
          styles.circle,
          toCircle(size),
          {
            backgroundColor: background,
            shadowOpacity,
            shadowRadius,
            shadowOffset: { width: 0, height: shadowOffsetY },
          },
        ]}
      >
        <Text style={[styles.count, { color: textColor, fontSize }]}>{formatClusterCount(count)}</Text>
      </View>
    </View>
  )

  const ringedCircle = rings.reduce(
    (wrapped, ring, depth) => {
      const wrappedSize = size + sumRingWidths(rings.slice(0, depth + 1)) * 2

      return (
        <View style={[styles.stack, toCircle(wrappedSize), { backgroundColor: ring.color }]}>{wrapped}</View>
      )
    },
    circle,
  )

  const outerSize = size + sumRingWidths(rings) * 2
  const touchTargetSize = Math.max(outerSize, MIN_TOUCH_TARGET_SIZE)

  return (
    <Mapbox.MarkerView coordinate={[movingCoordinate.longitude, movingCoordinate.latitude]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${count}개의 장소가 모여 있습니다`}
        onPress={onTap}
        onPressIn={() => {
          scale.set(withTiming(PRESSED_SCALE, { duration: 90 }))
        }}
        onPressOut={() => {
          scale.set(withSpring(1, { damping: 15, stiffness: 220 }))
        }}
      >
        <View style={[styles.touchArea, { width: touchTargetSize, height: touchTargetSize }]}>
          <Animated.View style={[pressedStyle, leavingStyle]}>{ringedCircle}</Animated.View>
        </View>
      </Pressable>
    </Mapbox.MarkerView>
  )
}

function toCircle(size: number) {
  return { width: size, height: size, borderRadius: size / 2 }
}

function sumRingWidths(rings: { width: number }[]) {
  return rings.reduce((total, ring) => total + ring.width, 0)
}

const styles = StyleSheet.create({
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1B3A',
  },
  count: {
    fontWeight: '700',
    includeFontPadding: false,
  },
})
