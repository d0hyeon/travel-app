import { Suspense } from 'react'
import { useTripId } from '../../../src/features/trip/useTripId'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { TripChecklist } from '../../../src/features/trip/trip-checklist/TripChecklist'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailChecklistRoute() {
  const tripId = useTripId()

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* 재조회 때 화면 전체가 다시 마운트되지 않도록 탭 안에 경계를 둔다. */}
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripChecklist tripId={tripId} />
      </Suspense>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  fill: { flex: 1 },
  content: { padding: 16 },
})
