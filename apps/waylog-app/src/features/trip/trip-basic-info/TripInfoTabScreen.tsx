import { Suspense } from 'react'
import { useTripDetailTabTripId } from '../useTripId'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { TripBasicInfoContent } from './TripBasicInfoContent'
import { palette } from '../../../shared/config/tokens'

export function TripInfoTabScreen() {
  const tripId = useTripDetailTabTripId()

  return (
    <View style={styles.screen}>
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripBasicInfoContent tripId={tripId} />
      </Suspense>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  fill: { flex: 1 },
})
