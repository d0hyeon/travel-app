import { useEffect, useRef, useState, type ReactNode } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { PRESS_OUT_DURATION_MS } from './PressableScale'

const MAX_BLUR_RADIUS = 10
const MIN_CHILDREN_OPACITY = 0.6
const BLUR_COVER_DURATION_MS = 200

const COVER = { duration: BLUR_COVER_DURATION_MS, easing: Easing.out(Easing.cubic) }
const REVEAL = { duration: PRESS_OUT_DURATION_MS, easing: Easing.bezier(0.3, 0, 0.2, 1) }

export interface BlurSwapProps {
  /** 값이 바뀌면 현재 children 을 흐리게 뭉갠 채로 새 children 으로 갈아 끼운 뒤 다시 선명하게 한다 */
  transitionKey: string | number
  children: ReactNode
}

export function BlurSwap({ transitionKey, children }: BlurSwapProps) {
  const [shown, setShown] = useState({ transitionKey, children })
  const latest = useRef({ transitionKey, children })
  latest.current = { transitionKey, children }

  const blurProgress = useSharedValue(0)
  const isSwapPending = shown.transitionKey !== transitionKey

  const showLatest = () => setShown(latest.current)

  useEffect(() => {
    if (!isSwapPending) {
      blurProgress.set(withTiming(0, REVEAL))
      return
    }
    blurProgress.set(
      withTiming(1, COVER, (finished) => {
        if (finished) scheduleOnRN(showLatest)
      }),
    )
  }, [isSwapPending, blurProgress])

  const blurStyle = useAnimatedStyle(() => ({
    opacity: 1 - blurProgress.value * (1 - MIN_CHILDREN_OPACITY),
    filter: [{ blur: blurProgress.value * MAX_BLUR_RADIUS }],
  }))

  return <Animated.View style={blurStyle}>{isSwapPending ? shown.children : children}</Animated.View>
}
