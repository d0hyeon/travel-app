import { Suspense } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useTripDetailTabTripId } from '../useTripId'
import TripExpenseContent from './TripExpenseContent'

export function TripExpenseTabScreen() {
  const tripId = useTripDetailTabTripId()

  return (
    // 재조회 때 화면 전체가 다시 마운트되지 않도록 탭 안에 경계를 둔다.
    <View style={styles.fill}>
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripExpenseContent tripId={tripId} />
      </Suspense>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
