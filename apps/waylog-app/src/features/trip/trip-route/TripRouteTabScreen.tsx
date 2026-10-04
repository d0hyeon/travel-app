import { Suspense } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useTripDetailTabTripId } from '~features/trip/useTripId'
import TripRoutesContent from './TripRoutesContent'

export function TripRouteTabScreen() {
  const tripId = useTripDetailTabTripId()

  // 경계를 탭 안에 둔다. 루트 하나만 있으면 순서 변경 같은 재조회에도
  // 화면 전체가 fallback 으로 바뀌어 다시 마운트되고, 그때 제스처가 끊긴다.
  return (
    <View style={styles.fill}>
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripRoutesContent tripId={tripId} />
      </Suspense>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
