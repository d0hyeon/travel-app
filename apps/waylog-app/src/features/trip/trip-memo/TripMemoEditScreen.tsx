import styled from '@emotion/native'
import { useTripMemo } from '@waylog/domains/trip-memo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Button, Stack, Text } from '../../../shared/components'
import { palette, radius } from '../../../shared/config/tokens'

const TitleInput = styled.TextInput`
  height: 40px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${palette.divider};
  padding-horizontal: 12px;
  font-size: 14px;
`

const ContentInput = styled.TextInput`
  flex: 1;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${palette.divider};
  padding: 12px;
  font-size: 14px;
  text-align-vertical: top;
`

interface Props {
  tripId: string
  memoId?: string
}

export function TripMemoEditScreen({ tripId, memoId }: Props) {
  const {
    data: { memos },
    add,
    update,
  } = useTripMemo(tripId)
  const router = useRouter()

  const editing = memos.find((memo) => memo.id === memoId)
  const [title, setTitle] = useState(editing?.title ?? '')
  const [content, setContent] = useState(editing?.content ?? '')

  const submit = async () => {
    if (content.trim() === '') return

    if (editing != null) {
      await update({ id: editing.id, title, content, isPinned: editing.isPinned })
    } else {
      await add({ title, content })
    }

    router.back()
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: palette.background }}>
      <Text variant="h6" bold>
        {editing != null ? '메모 수정' : '새 메모'}
      </Text>

      <TitleInput value={title} onChangeText={setTitle} placeholder="제목 (선택)" />
      <ContentInput
        value={content}
        onChangeText={setContent}
        placeholder="내용을 입력하세요"
        multiline
      />

      <Stack direction="row" gap={8} justify="flex-end">
        <Button size="lg" variant="text" onPress={() => router.back()}>
          취소
        </Button>
        <Button size="lg" onPress={submit}>
          저장
        </Button>
      </Stack>
    </View>
  )
}
