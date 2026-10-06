import { useEffect, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  Easing,
  interpolate,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { palette } from '~shared/config/tokens'

const CONTENT_INITIAL_SCALE = 0.85
const CONTENT_GAP = 100
const CONTENT_DURATION = 400

interface Props {
  children: ReactNode
  open?: boolean
  delay?: number
  duration?: number
}

/**
 * 웹 SlideReveal 과 같은 모양으로 펼친다.
 *
 * 웹은 useElementSize 로 높이를 재지만 RN 은 onLayout 이 그 자리를 맡는다.
 * 높이를 알기 전에는 펼칠 수 없으므로 잰 뒤에 시작한다.
 */
export function SlideReveal({ children, open = true, delay = 0, duration = 800 }: Props) {
  const [height, setHeight] = useState<number | null>(null)
  const progress = useSharedValue(0)
  const contentProgress = useSharedValue(0)

  const isPrepared = height != null

  useEffect(() => {
    if (!isPrepared) return

    progress.set(withDelay(delay, withTiming(open ? 1 : 0, { duration, easing: Easing.linear })))
    contentProgress.set(
      open
        ? withDelay(delay + duration + CONTENT_GAP, withTiming(1, { duration: CONTENT_DURATION }))
        : withTiming(0, { duration: CONTENT_DURATION }),
    )
  }, [open, isPrepared, delay, duration])

  const containerStyle = useAnimatedStyle(() => ({
    height: (height ?? 0) * progress.get(),
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentProgress.get(),
    transform: [{ scale: interpolate(contentProgress.get(), [0, 1], [CONTENT_INITIAL_SCALE, 1]) }],
  }))

  // 높이를 재는 동안에는 화면 밖에 두고 그린다.
  if (!isPrepared) {
    return (
      <View
        style={styles.measurement}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </View>
    )
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.content, contentStyle]}>{children}</Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  measurement: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  container: {
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
})
