import { MaterialIcons } from '@expo/vector-icons'
import { useTrip } from '@waylog/domains/modules/trip'
import { useRouter } from 'expo-router'
import { Pressable } from 'react-native'
import { Stack, Typography } from '../../../shared/components/mui'

interface Props {
  tripId: string
}

export function TripPostCreateCard({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const router = useRouter()

  if (!isTripOver(trip.endDate)) return null

  return (
    <Pressable
      accessibilityLabel="여행을 회고하는 포스트 만들기"
      onPress={() => router.push({ pathname: '/post/new', params: { tripId } })}
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingLeft: 14,
        paddingRight: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(74,122,255,0.25)',
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
      }}
    >
      <Stack sx={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#fff' }}>
        <MaterialIcons name="auto-awesome" size={22} color="#4A7AFF" />
      </Stack>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14.5, fontWeight: '700', color: '#111' }}>여행을 회고하는 포스트 만들기</Typography>
        <Typography sx={{ marginTop: 3, fontSize: 12.5, fontWeight: '500', color: '#6b6b73' }}>이 여행의 사진과 장소로 피드에 올려보세요</Typography>
      </Stack>
      <MaterialIcons name="chevron-right" size={24} color="#4A7AFF" />
    </Pressable>
  )
}

function isTripOver(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(endDate).getTime() < today.getTime()
}
