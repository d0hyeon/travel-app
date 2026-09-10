import { useLocalSearchParams, useRouter } from 'expo-router'
import { Suspense, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, IconButton, Stack, Typography } from '~/shared/components/design-system'
import { BottomArea } from '../../../../../src/shared/components/BottomArea'
import { TripMemoForm, type TripMemoFormRef } from '../../../../../src/features/trip/trip-memo/TripMemoForm'
import { useTripMemo } from '@waylog/domains/modules/trip-memo'
import { MaterialIcons } from '@expo/vector-icons'

export default function TripMemoEditRoute() {
  return (
    <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
      <Resolved />
    </Suspense>
  )
}

function Resolved() {
  const { tripId, memoId } = useLocalSearchParams<{ tripId: string; memoId: string }>()
  const router = useRouter()
  const { data: { memos }, update } = useTripMemo(tripId)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<TripMemoFormRef>(null)
  const memo = memos.find((item) => item.id === memoId)

  if (!memo) return <Typography style={styles.emptyMessage}>메모를 찾을 수 없어요</Typography>

  return (
    <SafeAreaView style={styles.fill}>
      <Stack direction="row" alignItems="center" style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>
        <Typography variant="subtitle1" style={styles.title}>메모 수정</Typography>
      </Stack>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TripMemoForm
          ref={formRef}
          defaultValues={{ title: memo.title ?? '', content: memo.content }}
          onSubmit={async ({ title, content }) => {
            setIsSaving(true)
            await update({ id: memo.id, title: title || null, content })
            router.back()
          }}
        />
      </ScrollView>
      <BottomArea position="static">
        <Button size="large" variant="contained" disabled={isSaving} onPress={() => formRef.current?.submit()} fullWidth >
          저장
        </Button>
      </BottomArea>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  emptyMessage: { padding: 24, textAlign: 'center' },
  title: { paddingHorizontal: 8 },
  header: { padding: 8 },
  content: { padding: 16, paddingBottom: 24 },
})
