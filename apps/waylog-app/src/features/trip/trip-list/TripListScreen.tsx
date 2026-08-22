import { signOut } from '@waylog/domains/auth'
import { useTrips } from '@waylog/domains/modules/trip'
import { useRouter } from 'expo-router'
import { Suspense } from 'react'
import { FlatList, Pressable, View } from 'react-native'
import { Button, Stack, Text } from '../../../shared/components'
import { palette } from '../../../shared/config/tokens'
import { TripUnreadCountBadge } from '../trip-chat/TripUnreadCountBadge'

export function TripListScreen() {
  const { data: trips } = useTrips()
  const router = useRouter()

  return (
    <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: palette.background }}>
      <Stack direction="row" align="center" justify="space-between" style={{ marginBottom: 16 }}>
        <Text variant="h6" bold>
          내 여행 {trips.length}건
        </Text>
        <Stack direction="row" align="center" gap={8}>
          <Button variant="text" size="sm" onPress={() => router.push('/trip/new')}>
            여행 만들기
          </Button>
          <Button variant="text" size="sm" onPress={() => signOut()}>
            로그아웃
          </Button>
        </Stack>
      </Stack>

      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: palette.divider }} />
        )}
        ListEmptyComponent={
          <Text variant="body2" color={palette.textSecondary}>
            여행이 없습니다
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/trip/${item.id}`)}
            style={{ paddingVertical: 14 }}
          >
            <Stack direction="row" align="center" justify="space-between" gap={8}>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text variant="body1" bold>
                  {item.name}
                </Text>
                <Text variant="caption" color={palette.textSecondary}>
                  {item.destinations.join(', ')} · {item.startDate} ~ {item.endDate}
                </Text>
              </Stack>
              <Suspense fallback={null}>
                <TripUnreadCountBadge tripId={item.id} variant="fill" />
              </Suspense>
            </Stack>
          </Pressable>
        )}
      />
    </View>
  )
}
