import { useRef } from 'react'
import { usePreservedCallback } from '@waylog/react'
import { useSharedValue } from 'react-native-reanimated'
import type { TabNavigationItemLayout } from './TabNavigation.types'
import type { TabSlot } from './tabNavigationGesture'

/**
 * 각 항목이 자기 위치를 보고하면 모아 두고, 가로 순서대로 정렬해 내준다.
 * 그 자리에 무엇을 그릴지(캡슐·밑줄·배경)는 알지 못한다.
 */
export function useItemLayouts() {
  const layouts = useRef(new Map<string, TabNavigationItemLayout>())
  // 히트 테스트는 순서가 있어야 한다. Map 은 순서를 보장하지 않으므로 정렬된 배열로 넘긴다.
  // 제스처가 UI 스레드에서 읽으므로 shared value 여야 한다.
  const orderedSlots = useSharedValue<TabSlot[]>([])

  const reportLayout = usePreservedCallback((key: string, layout: TabNavigationItemLayout) => {
    layouts.current.set(key, layout)
    orderedSlots.set(
      [...layouts.current.entries()]
        .map(([slotKey, slotLayout]) => ({ key: slotKey, x: slotLayout.x, width: slotLayout.width }))
        .toSorted((a, b) => a.x - b.x),
    )
  })

  const findLayout = usePreservedCallback((key: string) => layouts.current.get(key))

  return { reportLayout, findLayout, orderedSlots }
}
