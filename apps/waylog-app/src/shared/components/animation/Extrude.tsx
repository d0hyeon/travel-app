import { useCallback, useEffect, useRef, useState } from 'react'
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const EXTRUDE_EASING = Easing.bezier(0.4, 0, 0.2, 1)
const EXTRUDE_DURATION = 300

type ExtrudeAxis = 'x' | 'y' | 'both'

type Point = { x: number; y: number }

interface ExtrudeOptions {
  active: boolean

  /**
   * 이동을 허용할 축.
   *
   * 'y'면 source와 target의 x가 같다고 보고 수직으로만 옮긴다.
   */
  axis?: ExtrudeAxis

  duration?: number

  fadeTarget?: boolean
}

interface ExtrudeNodeBinding {
  ref: (node: View | null) => void
  style: StyleProp<ViewStyle>
}

interface ExtrudeBinding {
  /** 옮겨갈 대상. 눌린 자리는 높이가 접힌다. */
  source: ExtrudeNodeBinding & { onLayout: (event: LayoutChangeEvent) => void }

  /** 도착 지점. active일 때 페이드아웃된다. */
  target: ExtrudeNodeBinding

  /** source가 원래 차지하던 자리. 접힘 애니메이션이 걸린다. */
  placeholderStyle: StyleProp<ViewStyle>
}

/**
 * source를 target 자리로 밀어넣는다.
 *
 * 웹 shared/components/animation/Extrude의 네이티브 대응.
 *
 * SharedElementTransition(FLIP)과는 수렴점이 다르다.
 * FLIP은 항상 제자리(translate 0)로 정착하지만
 * Extrude는 active인 동안 target 자리에 머물러야 한다.
 * 그래서 오프셋을 직접 소유한다.
 *
 * target의 opacity를 명령형으로 쓰지 않고 style로 돌려주는 것도 핵심이다.
 * Fabric의 shadow tree는 불변이라 setNativeProps로 넣은 값은
 * 다음 commit에서 React의 props로 덮여 사라진다.
 */
export function useExtrude({
  active,
  axis = 'both',
  duration = EXTRUDE_DURATION,
  fadeTarget = true,
}: ExtrudeOptions): ExtrudeBinding {
  const [sourceNode, setSourceNode] = useState<View | null>(null)
  const [targetNode, setTargetNode] = useState<View | null>(null)
  const [sourceHeight, setSourceHeight] = useState(0)

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const targetOpacity = useSharedValue(1)

  /**
   * 정지 상태에서 잰 이동량.
   *
   * 접힘 애니메이션 도중의 좌표를 쓰지 않기 위해 캐시한다.
   * 레이아웃이 실제로 바뀌면 onLayout이 비운다.
   */
  const restingOffset = useRef<Point | null>(null)

  useEffect(() => {
    if (sourceNode == null || targetNode == null) return

    const timing = { duration, easing: EXTRUDE_EASING }

    if (fadeTarget) {
      targetOpacity.set(withTiming(active ? 0 : 1, timing))
    }

    if (!active) {
      translateX.set(withTiming(0, timing))
      translateY.set(withTiming(0, timing))
      return
    }

    let isCancelled = false

    /**
     * source는 제자리에 남고 transform으로만 target 자리에 가 있는 것처럼 보인다.
     */
    const moveToTarget = async () => {
      const offset = restingOffset.current ?? await measureRestingOffset()

      if (isCancelled || offset == null) return

      translateX.set(withTiming(offset.x, timing))
      translateY.set(withTiming(offset.y, timing))
    }

    /**
     * 접힘이 진행 중이면 두 노드가 이동 중이라 좌표를 믿을 수 없다.
     * 정지 상태에서 한 번 잰 값을 재사용하고,
     * 레이아웃이 실제로 바뀌면 onLayout이 무효화한다.
     */
    const measureRestingOffset = async () => {
      const [sourceOrigin, targetOrigin] = await Promise.all([
        measureOrigin(sourceNode),
        measureOrigin(targetNode),
      ])

      if (isCancelled) return null

      /**
       * 측정값에는 진행 중인 transform이 이미 반영되어 있다.
       * 현재 이동량을 빼야 원래 자리 기준의 오프셋이 나온다.
       * 빼지 않으면 왕복할 때마다 이동량이 누적된다.
       */
      const restingSource = {
        x: sourceOrigin.x - translateX.get(),
        y: sourceOrigin.y - translateY.get(),
      }

      const measured = getAxisOffset(restingSource, targetOrigin, axis)
      restingOffset.current = measured

      return measured
    }

    moveToTarget()

    return () => { isCancelled = true }
  }, [active, sourceNode, targetNode, axis, duration, fadeTarget, translateX, translateY, targetOpacity])

  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
  }))

  const targetStyle = useAnimatedStyle(() => ({ opacity: targetOpacity.get() }))

  const placeholderStyle = useAnimatedStyle(() => {
    if (sourceHeight === 0) return {}

    /**
     * 이동과 같은 duration을 쓴다.
     * 접힘이 먼저 끝나면 그 순간 레이아웃이 튀어 이동이 멈칫해 보인다.
     */
    return {
      height: withTiming(active ? 0 : sourceHeight, {
        duration,
        easing: EXTRUDE_EASING,
      }),
    }
  })

  return {
    source: {
      ref: useCallback((node: View | null) => { setSourceNode(node) }, []),
      style: motionStyle,
      /**
       * source는 absolute라 접힘에 영향받지 않는다.
       * 여기서 오는 높이는 항상 정지 상태의 실제 높이다.
       */
      onLayout: useCallback((event: LayoutChangeEvent) => {
        const measuredHeight = event.nativeEvent.layout.height
        if (measuredHeight <= 0) return

        /** 자리가 달라졌으니 다음 이동은 다시 잰다. */
        restingOffset.current = null
        setSourceHeight(measuredHeight)
      }, []),
    },
    target: {
      ref: useCallback((node: View | null) => { setTargetNode(node) }, []),
      style: targetStyle,
    },
    placeholderStyle,
  }
}

function measureOrigin(node: View): Promise<Point> {
  return new Promise((resolve) => {
    node.measureInWindow((x, y) => resolve({ x, y }))
  })
}

/**
 * source가 target 자리로 가는 데 필요한 이동량.
 *
 * 허용되지 않은 축은 0으로 눌러 그 방향으로는 움직이지 않게 한다.
 */
function getAxisOffset(source: Point, target: Point, axis: ExtrudeAxis): Point {
  return {
    x: axis === 'y' ? 0 : target.x - source.x,
    y: axis === 'x' ? 0 : target.y - source.y,
  }
}

export type { ExtrudeBinding, ExtrudeAxis }
