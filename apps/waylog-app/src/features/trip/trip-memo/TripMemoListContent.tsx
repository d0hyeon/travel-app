import styled from '@emotion/native'
import { useTripMemo } from '@waylog/domains/trip-memo'
import { useRouter } from 'expo-router'
import { FlatList, View } from 'react-native'
import { Button, Stack, Text } from '../../../shared/components'
import { palette, radius } from '../../../shared/config/tokens'

const MemoCard = styled.Pressable<{ pinned: boolean }>`
  padding: 12px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ pinned }) => (pinned ? palette.primary : palette.divider)};
  gap: 4px;
`

interface Props {
  tripId: string
}

export function TripMemoListContent({ tripId }: Props) {
  const {
    data: { memos },
  } = useTripMemo(tripId)
  const router = useRouter()

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: palette.background }}>
      <Stack direction="row" align="center" justify="space-between">
        <Text variant="caption" color={palette.textSecondary}>
          메모 {memos.length}개
        </Text>
        <Button size="sm" onPress={() => router.push(`/trip/${tripId}/memo/new`)}>
          메모 추가
        </Button>
      </Stack>

      <FlatList
        data={memos}
        keyExtractor={(memo) => memo.id}
        contentContainerStyle={{ paddingTop: 12, gap: 8 }}
        ListEmptyComponent={
          <Text variant="body2" color={palette.textSecondary}>
            메모가 없습니다
          </Text>
        }
        renderItem={({ item }) => (
          <MemoCard
            pinned={item.isPinned}
            onPress={() => router.push(`/trip/${tripId}/memo/${item.id}`)}
          >
            {item.title != null && item.title !== '' && (
              <Text variant="body2" bold numberOfLines={1}>
                {item.isPinned ? '📌 ' : ''}
                {item.title}
              </Text>
            )}
            <Text variant="caption" color={palette.textSecondary} numberOfLines={2}>
              {item.content}
            </Text>
          </MemoCard>
        )}
      />
    </View>
  )
}
