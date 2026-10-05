import { createTripPlace } from '@waylog/domains/modules/place'
import { toast } from 'sonner-native'
import { Button } from '~shared/components/design-system'
import { assert } from '~shared/utils/assert'
import { useScheduledTrips } from '~features/trip/useScheduledTrips'
import { useTripSelectSheet } from './useTripSelectSheet'

interface Props {
  placeId: string
}

export function AddTripButton({ placeId }: Props) {
  const { data: scheduledTrips } = useScheduledTrips()
  const selectTrip = useTripSelectSheet(scheduledTrips)

  assert(scheduledTrips.length > 0, '예정된 여행이 없으면 장소를 담을 수 없습니다.')

  const selectTargetTrip = async () => {
    if (scheduledTrips.length === 1) return scheduledTrips.at(0)
    return selectTrip()
  }

  return (
    <Button
      variant="contained"
      size="large"
      fullWidth
      onPress={async () => {
        const targetTrip = await selectTargetTrip()
        if (targetTrip == null) return
        await createTripPlace({ placeId, tripId: targetTrip.id })
        toast.success(`${targetTrip.name}에 추가되었어요`)
      }}
    >
      내 여행에 담기
    </Button>
  )
}
