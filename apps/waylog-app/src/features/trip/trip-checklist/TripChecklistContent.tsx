import styled from '@emotion/native'
import { getCompletionRate, useTripChecklist } from '@waylog/domains/trip-checklist'
import type { TripChecklist } from '@waylog/domains/trip-checklist'
import { useState } from 'react'
import { FlatList, View } from 'react-native'
import { Button, Stack, Text } from '../../../shared/components'
import { palette, radius } from '../../../shared/config/tokens'

const Row = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 12px 4px;
`

const Checkbox = styled.View<{ checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: ${radius.sm}px;
  border-width: 2px;
  border-color: ${({ checked }) => (checked ? palette.primary : palette.divider)};
  background-color: ${({ checked }) => (checked ? palette.primary : 'transparent')};
  align-items: center;
  justify-content: center;
`

const Input = styled.TextInput`
  flex: 1;
  height: 40px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${palette.divider};
  padding-horizontal: 12px;
  font-size: 14px;
`

interface Props {
  tripId: string
}

export function TripChecklistContent({ tripId }: Props) {
  const {
    data: { checklist },
    add,
    update,
  } = useTripChecklist(tripId)

  const [title, setTitle] = useState('')

  const submit = async () => {
    if (title.trim() === '') return
    await add({ title: title.trim() })
    setTitle('')
  }

  const toggle = (item: TripChecklist) =>
    update({ id: item.id, isCompleted: !item.isCompleted })

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: palette.background }}>
      <Stack gap={12}>
        <Text variant="caption" color={palette.textSecondary}>
          완료 {Math.round(getCompletionRate(checklist) * 100)}%
        </Text>

        <Stack direction="row" gap={8} align="center">
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="할 일을 입력하세요"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Button size="md" onPress={submit}>
            추가
          </Button>
        </Stack>
      </Stack>

      <FlatList
        data={checklist}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text variant="body2" color={palette.textSecondary}>
            할 일이 없습니다
          </Text>
        }
        renderItem={({ item }) => (
          <Row onPress={() => toggle(item)}>
            <Checkbox checked={item.isCompleted}>
              {item.isCompleted && (
                <Text variant="caption" color="#fff" bold>
                  ✓
                </Text>
              )}
            </Checkbox>
            <Text
              variant="body2"
              color={item.isCompleted ? palette.textSecondary : palette.text}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </Row>
        )}
      />
    </View>
  )
}
