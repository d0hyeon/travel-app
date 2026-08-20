import { useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native'
import { TripChecklist } from '../../../src/features/trip/trip-checklist/TripChecklist'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailChecklistRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <TripChecklist tripId={tripId} />
    </ScrollView>
  )
}
