import { useEffect, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

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

  const isPrepared = height != null

  useEffect(() => {
    if (!isPrepared) return

    progress.set(withDelay(delay, withTiming(open ? 1 : 0, { duration })))
  }, [open, isPrepared, delay, duration])

  const animatedStyle = useAnimatedStyle(() => ({
    height: (height ?? 0) * progress.get(),
    opacity: progress.get(),
  }))

  // 높이를 재는 동안에는 화면 밖에 두고 그린다.
  if (!isPrepared) {
    return (
      <View
        style={{ position: 'absolute', opacity: 0 }}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </View>
    )
  }

  return (
    <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>{children}</Animated.View>
  )
}
