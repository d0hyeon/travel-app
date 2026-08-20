import { useTripId } from '../../../src/features/trip/useTripId'
import { ScrollView } from 'react-native'
import { TripChecklist } from '../../../src/features/trip/trip-checklist/TripChecklist'
import { palette } from '../../../src/shared/config/tokens'

export default function TripDetailChecklistRoute() {
  const tripId = useTripId()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <TripChecklist tripId={tripId} />
    </ScrollView>
  )
}
