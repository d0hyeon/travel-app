import { View, StyleSheet } from 'react-native'
import { useTripDetailTabTripId } from '~features/trip/useTripId'
import { TripPhotoContent } from './TripPhotoContent'
import { useTripLayoutSetting } from '~features/trip/trip-layout/useTripLayoutSetting'

export function TripPhotoTabScreen() {
  const tripId = useTripDetailTabTripId()
  const { contentInsetTop } = useTripLayoutSetting({ variant: 'default' })

  return (
    <View style={[styles.fill, { paddingTop: contentInsetTop }]}>
      <TripPhotoContent tripId={tripId} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
