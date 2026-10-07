import { useTripDetailTabTripId } from '~features/trip/useTripId'
import { View, StyleSheet } from 'react-native'
import { TripBasicInfoContent } from './TripBasicInfoContent'
import { palette } from '~shared/config/tokens'
import { useTripLayoutSetting } from '~features/trip/trip-layout/useTripLayoutSetting'

export function TripInfoTabScreen() {
  const tripId = useTripDetailTabTripId()
  const { contentInsetTop } = useTripLayoutSetting({ variant: 'default' })

  return (
    <View style={[styles.screen, { paddingTop: contentInsetTop }]}>
      <TripBasicInfoContent tripId={tripId} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
})
