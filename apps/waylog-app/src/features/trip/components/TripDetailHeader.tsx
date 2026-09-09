import { useTrip } from '@waylog/domains/modules/trip'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Pressable } from 'react-native'
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
    <Stack direction="row" alignItems="center" style={styles.header}>
      <Box style={styles.iconPlaceholder} />
      <Stack style={styles.titleArea}>
        <Skeleton variant="text" style={styles.titlePlaceholder} />
      </Stack>
      <Box style={styles.iconPlaceholder} />
    </Stack>
  )
}

function Resolved() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const router = useRouter()
  const { data: trip, update } = useTrip(tripId)
  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <Pressable accessibilityLabel="뒤로가기" onPress={() => router.back()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={22} color={palette.text} />
      </Pressable>
      <Stack style={styles.titleArea}>
        <EditableText
          value={trip.name}
          variant="subtitle2"
          style={styles.title}
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

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.background },
  iconPlaceholder: { width: 22, height: 22, marginHorizontal: 4 },
  titleArea: { flex: 1, paddingHorizontal: 8, paddingVertical: 4 },
  titlePlaceholder: { width: '50%' },
  backButton: { padding: 4 },
  title: { fontWeight: '900' },
})
