import { useRef } from 'react'
import { useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { usePreservedCallback } from '@waylog/react'
import { BURST_IN_CONFIG, BURST_OUT_CONFIG, CAPSULE_TRANSITION_CONFIG } from './tabCapsuleMotion'
import type { DerivedValue } from 'react-native-reanimated'
import type { TabCapsuleState, TabNavigationItemLayout } from './TabNavigation.types'

/**
 * 캡슐이 어디에 있는지를 담는 값들. 제스처 영역이 쓰고 표현 영역이 읽으므로
 * 어느 한쪽이 소유하지 않고 TabNavigation 이 만들어 컨텍스트로 내려보낸다.
 */
export function useTabCapsuleState(variantProgress: DerivedValue<number>) {
  const capsule: TabCapsuleState = {
    x: useSharedValue(0),
    width: useSharedValue(0),
    burst: useSharedValue(0),
    isDragging: useSharedValue(false),
    lastPassedKey: useSharedValue(''),
    variantProgress,
  }
  const hasPlaced = useRef(false)

  const moveTo = usePreservedCallback((layout: TabNavigationItemLayout) => {
    // 최초 배치는 애니메이션 없이 자리를 잡는다. 0 에서 미끄러져 들어오면 안 된다.
    if (!hasPlaced.current) {
      capsule.x.set(layout.x)
      capsule.width.set(layout.width)
      hasPlaced.current = true
      return
    }
    // 손가락이 캡슐을 잡고 있는 동안에는 activeKey 가 자리를 빼앗지 못한다.
    if (capsule.isDragging.get()) return

    capsule.x.set(withTiming(layout.x, CAPSULE_TRANSITION_CONFIG))
    capsule.width.set(withTiming(layout.width, CAPSULE_TRANSITION_CONFIG))
    capsule.burst.set(withSequence(withTiming(1, BURST_IN_CONFIG), withTiming(0, BURST_OUT_CONFIG)))
  })

  return { capsule, moveTo }
}
