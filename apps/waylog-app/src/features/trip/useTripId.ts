import { assert } from '@waylog/utility'
import { useLocalSearchParams } from 'expo-router'

// 전역 파라미터는 앱이 공유하는 값 하나라 다른 화면으로 이동하면 곧바로 갱신된다.
// 여행 화면은 아직 언마운트되지 않아 한 번 더 렌더되므로 그때 tripId 를 잃는다.
export function useTripId() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>()
  assert(!!tripId, 'tripId is required')

  return tripId
}
