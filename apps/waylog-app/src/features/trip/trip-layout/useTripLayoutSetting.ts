import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useRef, type ReactNode } from 'react'
import { useTripLayout, type TripLayoutVariant } from './TripLayout'

interface Setting {
  variant: TripLayoutVariant
  actions?: ReactNode
}

/**
 * 여행 상세 레이아웃에 이 화면이 원하는 모양과 헤더 액션을 요청한다.
 * 탭은 포커스를 잃어도 마운트가 유지되므로, 요청은 포커스된 동안에만 유효하다.
 * headerInset 은 요청한 모양에서 헤더가 콘텐츠 위로 가리는 높이다.
 * actions 는 헤더로 옮겨 렌더링되므로, 필요한 상태와 훅을 스스로 가진 컴포넌트여야 한다.
 */
export function useTripLayoutSetting({ variant, actions }: Setting) {
  const { requestLayout, headerHeight } = useTripLayout()
  const actionsRef = useRef(actions)
  actionsRef.current = actions
  const hasActions = actions != null

  useFocusEffect(
    useCallback(
      () => requestLayout({ variant, actions: hasActions ? actionsRef.current : undefined }),
      [variant, hasActions, requestLayout],
    ),
  )

  return { headerInset: variant === 'glass' ? headerHeight : 0 }
}
