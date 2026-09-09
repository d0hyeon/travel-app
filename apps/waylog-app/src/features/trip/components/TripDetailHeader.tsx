import { useTrip } from '@waylog/domains/modules/trip'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense } from 'react'
import { Box, Skeleton, Stack } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { ChatIconButton } from '../trip-chat/ChatIconButton'
import { EditableText } from '../../../shared/components/EditableText'

export function TripDetailHeader() {
  return (
    <Suspense fallback={<TripDetailHeaderSkeleton />}>
      <Resolved />
    </Suspense>
  )
}

function TripDetailHeaderSkeleton() {
  return (
    <Stack direction="row" alignItems="center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.background }}>
      <Box style={{ width: 22, height: 22, marginHorizontal: 4 }} />
      <Stack style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4 }}>
        <Skeleton variant="text" style={{ width: '50%' }} />
      </Stack>
      <Box style={{ width: 22, height: 22, marginHorizontal: 4 }} />
    </Stack>
  )
}

function Resolved() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const router = useRouter()
  const { data: trip, update } = useTrip(tripId)
  return (
    <Stack direction="row" alignItems="center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.background }}>
      <Pressable accessibilityLabel="뒤로가기" onPress={() => router.back()} style={{ padding: 4 }}>
        <MaterialIcons name="arrow-back" size={22} color={palette.text} />
      </Pressable>
      <Stack style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4 }}>
        <EditableText
          value={trip.name}
          variant="subtitle2"
          style={{ fontWeight: '900' }}
          endIcon={<MaterialIcons name="edit" size={15} color={palette.grey} />}
          onSubmit={async (name) => {
            await update({ name: name.trim() })
          }}
        />
      </Stack>
      <ChatIconButton tripId={tripId} />
    </Stack>
  )
}
