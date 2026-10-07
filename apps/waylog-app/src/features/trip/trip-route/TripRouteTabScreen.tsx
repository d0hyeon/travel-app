import { View, StyleSheet } from 'react-native'
import { useTripDetailTabTripId } from '~features/trip/useTripId'
import TripRoutesContent from './TripRoutesContent'

export function TripRouteTabScreen() {
  const tripId = useTripDetailTabTripId()

  return (
    <View style={styles.fill}>
      <TripRoutesContent tripId={tripId} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
