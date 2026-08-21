import { MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { formatDate } from 'date-fns'
import { Suspense } from 'react'
import { ScrollView, ActivityIndicator } from 'react-native'
import { IconButton, Stack, Typography } from '../../../../src/shared/components/mui'
import { PopMenu } from '../../../../src/shared/components/PopMenu'
import { useConfirmDialog } from '../../../../src/shared/components/confirm-dialog/useConfirmDialog'
import { useTripMemo } from '@waylog/domains/trip-memo'

export default function TripMemoDetailRoute() {
  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
      <Resolved />
    </Suspense>
  )
}

function Resolved() {
  const { tripId, memoId } = useLocalSearchParams<{ tripId: string; memoId: string }>()
  const router = useRouter()
  const confirm = useConfirmDialog()
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId)
  const memo = memos.find((item) => item.id === memoId)

  if (!memo) {
    return <Typography sx={{ padding: 24, textAlign: 'center' }}>메모를 찾을 수 없어요</Typography>
  }

  return (
    <Stack sx={{ flex: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: 8 }}>
        <IconButton onClick={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>
        <Typography variant="subtitle1" numberOfLines={1} sx={{ flex: 1, paddingHorizontal: 8 }}>
          {memo.title || '메모'}
        </Typography>
        <PopMenu
          items={[
            <PopMenu.Item key="pin" onClick={() => togglePin(memo.id)}>
              {memo.isPinned ? '고정 해제' : '고정'}
            </PopMenu.Item>,
            <PopMenu.Item key="edit" onClick={() => router.push(`/trip/${tripId}/memo/${memo.id}/edit`)}>
              수정
            </PopMenu.Item>,
            <PopMenu.Item
              key="delete"
              color="error"
              onClick={async () => {
                if (!(await confirm('이 메모를 삭제하시겠습니까?'))) return
                await remove(memo.id)
                router.back()
              }}
            >
              삭제
            </PopMenu.Item>,
          ]}
        />
      </Stack>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(memo.createdAt, 'yyyy년 M월 d일 a h:mm')}
        </Typography>
        <Typography variant={memo.title ? 'body2' : 'body1'} sx={{ whiteSpace: 'pre-wrap' }}>
          {memo.content}
        </Typography>
      </ScrollView>
    </Stack>
  )
}
