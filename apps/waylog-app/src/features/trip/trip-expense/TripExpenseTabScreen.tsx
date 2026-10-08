import { View, StyleSheet } from 'react-native'
import { useTripDetailTabTripId } from '~features/trip/useTripId'
import TripExpenseContent from './TripExpenseContent'
import { useTripLayoutSetting } from '~features/trip/trip-layout/useTripLayoutSetting'

export function TripExpenseTabScreen() {
  const tripId = useTripDetailTabTripId()
  const { contentInsetTop } = useTripLayoutSetting({ variant: 'default' })

  return (
    <View style={[styles.fill, { paddingTop: contentInsetTop }]}>
      <TripExpenseContent tripId={tripId} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
