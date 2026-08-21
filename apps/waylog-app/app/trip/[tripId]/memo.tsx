import { Suspense } from 'react'
import { useTripId } from '../../../src/features/trip/useTripId'
import { ActivityIndicator, View } from 'react-native'
import { TripMemo } from '../../../src/features/trip/trip-memo/TripMemo'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailMemoRoute() {
  const tripId = useTripId()

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* 재조회 때 화면 전체가 다시 마운트되지 않도록 탭 안에 경계를 둔다. */}
      <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
        <TripMemo tripId={tripId} />
      </Suspense>
    </View>
  )
}
