import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { useTripLayout, type TripLayoutVariant } from './TripLayout'

interface Setting {
  variant: TripLayoutVariant
}

/**
 * 여행 상세 레이아웃에 이 화면이 원하는 모양을 요청한다.
 * 탭은 포커스를 잃어도 마운트가 유지되므로, 요청은 포커스된 동안에만 유효하다.
 * headerInset 은 요청한 모양에서 헤더가 콘텐츠 위로 가리는 높이다.
 */
export function useTripLayoutSetting({ variant }: Setting) {
  const { requestVariant, headerHeight } = useTripLayout()

  useFocusEffect(
    useCallback(() => requestVariant(variant), [variant, requestVariant]),
  )

  return { headerInset: variant === 'glass' ? headerHeight : 0 }
}
