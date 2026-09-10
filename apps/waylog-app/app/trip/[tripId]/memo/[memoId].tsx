import { MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { formatDate } from 'date-fns'
import { Suspense } from 'react'
import { ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton, Stack, Typography } from '~/shared/components/design-system'
import { PopMenu } from '../../../../src/shared/components/PopMenu'
import { useConfirmDialog } from '../../../../src/shared/components/confirm-dialog/useConfirmDialog'
import { extractUrls, renderTextWithLinks } from '../../../../src/shared/utils/urls'
import { OgPreviewCard } from '../../../../src/features/open-graph/OgPreviewCard'
import { useTripMemo } from '@waylog/domains/modules/trip-memo'

export default function TripMemoDetailRoute() {
  return (
    <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
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
    return <Typography style={styles.emptyMessage}>메모를 찾을 수 없어요</Typography>
  }

  const urls = extractUrls(memo.content)

  return (
    <SafeAreaView style={styles.fill}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>
        <Typography variant="subtitle1" numberOfLines={1} style={styles.title}>
          {memo.title || '메모'}
        </Typography>
        <PopMenu
          items={[
            <PopMenu.Item key="pin" onPress={() => togglePin(memo.id)}>
              {memo.isPinned ? '고정 해제' : '고정'}
            </PopMenu.Item>,
            <PopMenu.Item key="edit" onPress={() => router.push(`/trip/${tripId}/memo/${memo.id}/edit`)}>
              수정
            </PopMenu.Item>,
            <PopMenu.Item
              key="delete"
              color="error"
              onPress={async () => {
                if (!(await confirm('이 메모를 삭제하시겠습니까?'))) return
                await remove(memo.id)
                router.back();
              }}
            >
              삭제
            </PopMenu.Item>,
          ]}
        />
      </Stack>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(memo.createdAt, 'yyyy년 M월 d일 a h:mm')}
        </Typography>
        <Typography variant={memo.title ? 'body2' : 'body1'}>
          {renderTextWithLinks(memo.content)}
        </Typography>
        {urls.length > 0 && <OgPreviewCard url={urls[0]} />}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  emptyMessage: { padding: 24, textAlign: 'center' },
  title: { flex: 1, paddingHorizontal: 8 },
  header: { padding: 8 },
  content: { padding: 20, gap: 8 },
})
