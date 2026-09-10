import type { ReactNode } from 'react'
import type { DerivedValue, SharedValue } from 'react-native-reanimated'
import type { TabSlot } from './tabNavigationGesture'

export type TabNavigationVariant = 'default' | 'apple'

export interface TabNavigationItemLayout {
  x: number
  width: number
}

/**
 * 캡슐의 현재 자리. 제스처 영역이 쓰고 표현 영역이 읽는다.
 * 두 영역이 같은 값을 두고 협력하므로 컨텍스트로 공유한다.
 */
export interface TabCapsuleState {
  x: SharedValue<number>
  width: SharedValue<number>
  /** 전환 순간 부풀어 라벨을 가리는 정도. 0 평상, 1 최대 */
  burst: SharedValue<number>
  /** 드래그 중에는 activeKey 가 아니라 손가락이 캡슐의 주인이다 */
  isDragging: SharedValue<boolean>
  /** 드래그 중 마지막으로 지난 탭. 같은 탭을 거듭 알리지 않기 위해 UI 스레드가 기억한다 */
  lastPassedKey: SharedValue<string>
  /** apple 에서만 캡슐이 보인다 */
  variantProgress: DerivedValue<number>
}

export interface TabNavigationContextValue {
  activeKey: string
  variant: TabNavigationVariant
  onSelect: (key: string) => void
  reportItemLayout: (key: string, layout: TabNavigationItemLayout) => void
  capsule: TabCapsuleState
  /** 항목들의 가로 순서와 위치. 드래그가 UI 스레드에서 읽는다 */
  orderedSlots: SharedValue<TabSlot[]>
}

export interface TabNavigationProps {
  variant: TabNavigationVariant
  value?: string
  defaultValue?: string
  onChange?: (key: string) => void
  /**
   * 드래그가 새 탭 위를 지날 때마다 불린다. 탭이 바뀔 때만 불리며,
   * 손을 떼는 순간의 확정은 onChange 가 맡는다.
   * 화면 전환처럼 무거운 일은 여기서 하지 않는다 — 훑고 지나간 탭까지 전부 실행된다.
   */
  onTab?: (key: string) => void
  children: ReactNode
}

export interface TabNavigationItemProps {
  value: string
  label: string
  icon: (props: { color: string; focused: boolean }) => ReactNode
}
