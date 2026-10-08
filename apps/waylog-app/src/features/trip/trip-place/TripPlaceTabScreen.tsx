import { View, StyleSheet } from 'react-native'
import { useTripDetailTabTripId } from '~features/trip/useTripId'
import TripPlaceContent from './TripPlaceContent'

export function TripPlaceTabScreen() {
  const tripId = useTripDetailTabTripId()

  return (
    <View style={styles.fill}>
      <TripPlaceContent tripId={tripId} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
