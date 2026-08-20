import { useTripId } from '../../../src/features/trip/useTripId'
import { View } from 'react-native'
import { TripBasicInfoContent } from '../../../src/features/trip/trip-basic-info/TripBasicInfoContent'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailIndexRoute() {
  const tripId = useTripId()

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <TripBasicInfoContent tripId={tripId} />
    </View>
  )
}
