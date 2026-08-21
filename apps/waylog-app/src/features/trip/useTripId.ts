import { assert } from '@waylog/domains/utils'
import { useGlobalSearchParams } from 'expo-router'

// 웹 useTripId 와 같은 역할이다.
// 탭은 비활성 화면도 미리 마운트하는데, useLocalSearchParams 는 활성 라우트의
// 파라미터만 주므로 비활성 탭에서 undefined 가 된다. 전역 파라미터를 읽는다.
export function useTripId() {
  const { tripId } = useGlobalSearchParams<{ tripId: string }>()
  assert(!!tripId, 'tripId is required')

  return tripId
}
