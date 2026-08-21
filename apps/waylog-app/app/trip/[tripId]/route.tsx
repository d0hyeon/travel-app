import { Suspense } from 'react'
import { ActivityIndicator } from 'react-native'
import { useTripId } from '../../../src/features/trip/useTripId'
import TripRoutesContent from '../../../src/features/trip/trip-route/TripRoutesContent'

export default function TripDetailRouteRoute() {
  const tripId = useTripId()

  // 경계를 탭 안에 둔다. 루트 하나만 있으면 순서 변경 같은 재조회에도
  // 화면 전체가 fallback 으로 바뀌어 다시 마운트되고, 그때 제스처가 끊긴다.
  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
      <TripRoutesContent tripId={tripId} />
    </Suspense>
  )
}
