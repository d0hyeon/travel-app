import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { TripMemo } from '../../../src/features/trip/trip-memo/TripMemo'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailMemoRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <TripMemo tripId={tripId} />
    </View>
  )
}
