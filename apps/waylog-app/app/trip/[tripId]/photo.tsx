import { Suspense } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useTripId } from '../../../src/features/trip/useTripId'
import { TripPhotoContent } from '../../../src/features/trip/trip-photo/TripPhotoContent'

export default function TripDetailPhotoRoute() {
  const tripId = useTripId()

  return (
    // 재조회 때 화면 전체가 다시 마운트되지 않도록 탭 안에 경계를 둔다.
    <View style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
        <TripPhotoContent tripId={tripId} />
      </Suspense>
    </View>
  )
}
