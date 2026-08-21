import { useLocalSearchParams, useRouter } from 'expo-router'
import { Suspense, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'
import { Button, IconButton, Stack, Typography } from '../../../../../src/shared/components/mui'
import { TripMemoForm, type TripMemoFormRef } from '../../../../../src/features/trip/trip-memo/TripMemoForm'
import { useTripMemo } from '@waylog/domains/trip-memo'
import { MaterialIcons } from '@expo/vector-icons'

export default function TripMemoEditRoute() {
  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
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

  if (!memo) return <Typography sx={{ padding: 24, textAlign: 'center' }}>메모를 찾을 수 없어요</Typography>

  return (
    <Stack sx={{ flex: 1 }}>
      <Stack direction="row" alignItems="center" sx={{ padding: 8 }}>
        <IconButton onClick={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>
        <Typography variant="subtitle1" sx={{ paddingHorizontal: 8 }}>메모 수정</Typography>
      </Stack>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
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
      <Stack sx={{ padding: 16 }}>
        <Button fullWidth variant="contained" disabled={isSaving} onClick={() => formRef.current?.submit()}>
          저장
        </Button>
      </Stack>
    </Stack>
  )
}
