import { useTrip } from '@waylog/domains/trip'
import { useTripMembers } from '@waylog/domains/trip-member'
import { formatTripDate, getTripDuration } from '@waylog/domains/trip'
import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { Button, Stack, Text } from '../../../shared/components'
import { palette } from '../../../shared/config/tokens'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { data: members } = useTripMembers(tripId)

  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)
  const router = useRouter()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Stack gap={16}>
        <Stack gap={4}>
          <Text variant="h6" bold>
            {trip.name}
          </Text>
          <Text variant="body2" color={palette.textSecondary}>
            {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)} · {nights}박 {days}일
          </Text>
        </Stack>

        <InfoRow label="목적지" value={trip.destinations.join(', ')} />
        <InfoRow label="멤버" value={members.map((member) => member.name).join(', ')} />

        <Stack direction="row" gap={8}>
          <Button
            size="md"
            variant="outlined"
            onPress={() => router.push(`/trip/${tripId}/checklist`)}
          >
            준비물
          </Button>
          <Button size="md" variant="outlined" onPress={() => router.push(`/trip/${tripId}/memo`)}>
            메모
          </Button>
        </Stack>
      </Stack>
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="caption" color={palette.textSecondary}>
        {label}
      </Text>
      <Text variant="body1">{value === '' ? '-' : value}</Text>
    </View>
  )
}
