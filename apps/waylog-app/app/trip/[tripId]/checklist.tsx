import { Suspense } from 'react'
import { useTripId } from '../../../src/features/trip/useTripId'
import { ActivityIndicator, ScrollView } from 'react-native'
import { TripChecklist } from '../../../src/features/trip/trip-checklist/TripChecklist'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailChecklistRoute() {
  const tripId = useTripId()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* 재조회 때 화면 전체가 다시 마운트되지 않도록 탭 안에 경계를 둔다. */}
      <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
        <TripChecklist tripId={tripId} />
      </Suspense>
    </ScrollView>
  )
}
