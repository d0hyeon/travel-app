import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, withTiming } from 'react-native-reanimated'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { useTabNavigationContext } from './TabNavigationContext'
import { findTabKeyAtX, getDraggedCapsuleX } from './tabNavigationGesture'
import { CAPSULE_TRANSITION_CONFIG } from './tabCapsuleMotion'
import type { ReactNode } from 'react'

// 길게 눌러야 드래그가 시작된다. 바로 잡으면 탭 한 번 누르는 것과 구분되지 않는다.
const DRAG_HOLD_DURATION = 120

// 햅틱이 막히더라도 탭 동작 자체는 이어져야 한다.
function vibrate(style: ImpactFeedbackStyle) {
  impactAsync(style).catch(() => { })
}

interface TabCapsuleDragAreaProps {
  /** 드래그가 끝나 탭이 확정됐을 때. 지나는 동안 이미 울렸으므로 햅틱은 주지 않는다 */
  onFinish: (key: string) => void
  /** 드래그가 새 탭 위를 지날 때마다 */
  onMove?: (key: string) => void
  children: ReactNode
}

/**
 * 탭바를 끌어 캡슐을 옮기는 영역. 캡슐의 자리를 바꿀 뿐 그리지는 않는다.
 * 그리는 쪽은 TabCapsule 이며, 둘은 컨텍스트의 capsule 을 두고 협력한다.
 */
export function TabCapsuleDragArea({ onFinish, onMove, children }: TabCapsuleDragAreaProps) {
  const { activeKey, capsule, orderedSlots } = useTabNavigationContext()

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(DRAG_HOLD_DURATION)
    .onStart(() => {
      capsule.isDragging.set(true)
      capsule.lastPassedKey.set(activeKey)
      // 손끝에 드래그가 잡혔음을 알린다. 대기 시간이 짧아 시각 신호만으로는 놓치기 쉽다.
      runOnJS(vibrate)(ImpactFeedbackStyle.Medium)
    })
    .onUpdate(({ x }) => {
      const slots = orderedSlots.get()
      capsule.x.set(getDraggedCapsuleX({ touchX: x, width: capsule.width.get(), slots }))

      // 한 탭 안에서 손가락이 움직이는 동안에는 알리지 않는다.
      // 매 프레임 흘리면 같은 탭으로 초당 60번 불린다.
      const key = findTabKeyAtX(x, slots)
      if (!key || key === capsule.lastPassedKey.get()) return
      capsule.lastPassedKey.set(key)
      runOnJS(vibrate)(ImpactFeedbackStyle.Light)
      if (onMove) runOnJS(onMove)(key)
    })
    .onEnd(({ x }) => {
      const slots = orderedSlots.get()
      const key = findTabKeyAtX(x, slots)
      const target = slots.find((slot) => slot.key === key)
      if (target) {
        capsule.x.set(withTiming(target.x, CAPSULE_TRANSITION_CONFIG))
        capsule.width.set(withTiming(target.width, CAPSULE_TRANSITION_CONFIG))
      }
      // 드래그 중 이 탭을 지날 때 이미 울렸다. 손 뗄 때 또 울리면 겹친다.
      if (key) runOnJS(onFinish)(key)
    })
    .onFinalize(() => {
      capsule.isDragging.set(false)
    })

  return <GestureDetector gesture={dragGesture}>{children}</GestureDetector>
}
