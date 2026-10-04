import { MaterialIcons } from '@expo/vector-icons'
import { useTripMemo } from '@waylog/domains/modules/trip-memo'
import { formatDate } from 'date-fns'
import { Suspense } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton, Stack, Typography } from '~shared/components/design-system'
import { useAppNavigation, useAppRoute } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { OgPreviewCard } from '~features/open-graph/OgPreviewCard'
import { PopMenu } from '~shared/components/PopMenu'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { extractUrls, renderTextWithLinks } from '~shared/utils/urls'

export type TripMemoDetailParams = { tripId: string; memoId: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.여행_메모_상세]: TripMemoDetailParams
  }
}

export function TripMemoDetailScreen() {
  return (
    <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
      <Resolved />
    </Suspense>
  )
}

function Resolved() {
  const { params } = useAppRoute<typeof AppRoute.여행_메모_상세>()
  const { tripId } = params
  const navigation = useAppNavigation()
  const confirm = useConfirmDialog()
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId)
  const memo = memos.find((item) => item.id === params.memoId)

  if (!memo) {
    return <Typography style={styles.emptyMessage}>메모를 찾을 수 없어요</Typography>
  }

  const urls = extractUrls(memo.content)

  return (
    <SafeAreaView style={styles.fill}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>

        {memo.isPinned && <MaterialIcons name="push-pin" size={18} color="#4C84FF" />}
        <Typography variant="subtitle1" numberOfLines={1} style={styles.title}>
          {memo.title || '메모'}
        </Typography>

        <PopMenu
          items={[
            <PopMenu.Item key="pin" onPress={() => togglePin(memo.id)}>
              {memo.isPinned ? '고정 해제' : '고정'}
            </PopMenu.Item>,
            <PopMenu.Item key="edit" onPress={() => navigation.navigate(AppRoute.여행_메모_편집, { tripId, memoId: memo.id })}>
              수정
            </PopMenu.Item>,
            <PopMenu.Item
              key="delete"
              color="error"
              onPress={async () => {
                if (!(await confirm('이 메모를 삭제하시겠습니까?'))) return
                await remove(memo.id)
                navigation.goBack()
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
