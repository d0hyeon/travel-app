import { Suspense } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useTripId } from '../../../src/features/trip/useTripId'
import TripExpenseContent from '../../../src/features/trip/trip-expense/TripExpenseContent'

export default function TripDetailExpenseRoute() {
  const tripId = useTripId()

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
