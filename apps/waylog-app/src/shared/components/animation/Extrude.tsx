import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ExtrudeProps = PropsWithChildren<{
  active: boolean
  target: View | null

  duration?: number

  fadeTarget?: boolean

  axis?: 'x' | 'y' | 'both'

  style?: StyleProp<ViewStyle>
}>

/** 웹 shared/components/animation/Extrude의 네이티브 대응 컴포넌트. */
export function Extrude({
  active,
  target,
  children,
  duration = 300,
  fadeTarget = true,
  axis = 'both',
  style,
}: ExtrudeProps) {
  const [source, setSource] = useState<View | null>(null)
  const [sourceHeight, setSourceHeight] = useState(0)
  const safeAreaInsets = useSafeAreaInsets()

  /**
   * 최초 위치 고정
   * transform 누적 방지
   */
  const initialRectRef = useRef<{ x: number; y: number } | null>(null)
  const [initialRect, setInitialRect] = useState<{ x: number; y: number } | null>(null)

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const targetOpacity = useSharedValue(1)

  /**
   * 최초 rect 저장
   */
  useEffect(() => {
    if (source == null) return

    const frame = requestAnimationFrame(() => {
      source.measureInWindow((x, y) => {
        if (initialRectRef.current != null) return

        const rect = {
          x: x < safeAreaInsets.left ? x + safeAreaInsets.left : x,
          y: y < safeAreaInsets.top ? y + safeAreaInsets.top : y,
        }
        initialRectRef.current = rect
        setInitialRect(rect)
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [source, safeAreaInsets.left, safeAreaInsets.top])

  /**
   * target fade
   *
   * 웹은 target 노드에 CSS transition을 걸지만
   * RN은 외부 노드에 트랜지션을 걸 수 없다.
   * 대신 shared value로 트윈을 만들고 매 프레임 노드에 반영한다.
   */
  const applyTargetOpacity = useCallback((opacity: number) => {
    target?.setNativeProps({ style: { opacity } })
  }, [target])

  useAnimatedReaction(
    () => targetOpacity.get(),
    (opacity, previous) => {
      if (opacity === previous) return
      runOnJS(applyTargetOpacity)(opacity)
    },
    [applyTargetOpacity],
  )

  useEffect(() => {
    if (target == null) return

    const timing = { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) }

    /**
     * 위치 측정과 무관하므로 먼저 건다.
     */
    if (fadeTarget) {
      targetOpacity.set(withTiming(active ? 0 : 1, timing))
    }

    if (initialRect == null) return

    const frame = requestAnimationFrame(() => {
      target.measureInWindow((targetX, targetY) => {
        const rawDx = targetX - initialRect.x
        const rawDy = targetY - initialRect.y
        const dx = axis === 'y' ? 0 : rawDx
        const dy = axis === 'x' ? 0 : rawDy

        translateX.set(withTiming(active ? dx : 0, timing))
        translateY.set(withTiming(active ? dy : 0, timing))
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [active, target, initialRect, duration, fadeTarget, axis, translateX, translateY, targetOpacity])

  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
  }))

  const layoutStyle = useAnimatedStyle(() => {
    if (sourceHeight === 0) return {}

    return {
      height: withTiming(active && initialRect != null ? 0 : sourceHeight, {
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    }
  })

  return (
    <Animated.View style={[{ overflow: 'visible' }, layoutStyle]}>
      <View
        collapsable={false}
        ref={useCallback((node: View | null) => { setSource(node) }, [])}
        onLayout={(event) => {
          const measuredHeight = event.nativeEvent.layout.height
          if (sourceHeight === 0 && measuredHeight > 0) setSourceHeight(measuredHeight)
        }}
        style={[
          { alignSelf: 'flex-start', flexGrow: 0, flexShrink: 0 },
          sourceHeight > 0 && { position: 'absolute', left: 0, top: 0 },
        ]}
      >
        <Animated.View style={[motionStyle, style]}>
          {children}
        </Animated.View>
      </View>
    </Animated.View>
  )
}
