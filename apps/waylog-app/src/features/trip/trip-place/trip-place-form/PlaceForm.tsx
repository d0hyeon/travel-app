import {
  PlaceCategoryColorCode,
  PlaceCategoryTypeLabel,
  PlaceCategoryTypes,
  type PlaceCategoryType,
} from '@waylog/domains/modules/place'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Box, Chip, Stack, TextField, Typography } from '~/shared/components/design-system'
import { PopMenu } from '../../../../shared/components/PopMenu'

export interface PlaceFormValues {
  name: string
  address: string
  /** null은 미설정 */
  category: PlaceCategoryType | null
  memo: string
  tags: string[]
}

export interface PlaceFormRef {
  submit: () => void
}

interface Props {
  defaultValues?: Partial<PlaceFormValues>
  onSubmit: (data: PlaceFormValues) => void
}

// 웹 PlaceForm 과 같은 값 모양을 유지한다.
export const PlaceForm = forwardRef<PlaceFormRef, Props>(function PlaceForm(
  { defaultValues, onSubmit },
  ref,
) {
  const { control, handleSubmit, watch, setValue } = useForm<PlaceFormValues>({
    defaultValues: {
      name: '',
      address: '',
      category: null,
      memo: '',
      tags: [],
      ...defaultValues,
    },
  })

  const [tagInput, setTagInput] = useState('')
  const category = watch('category')
  const tags = watch('tags')

  useImperativeHandle(ref, () => ({ submit: () => void handleSubmit(onSubmit)() }), [
    handleSubmit,
    onSubmit,
  ])

  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          카테고리
        </Typography>
        <PopMenu
          trigger={(
            <TextField
              pointerEvents="none"
              fullWidth
              variant="outlined"
              value={category == null ? '선택 안함' : PlaceCategoryTypeLabel[category]}
              editable={false}
            />
          )}
          items={(
            <>
              <PopMenu.Item onPress={() => setValue('category', null)}>선택 안함</PopMenu.Item>
              {PlaceCategoryTypes.map((type) => (
                <PopMenu.Item key={type} onPress={() => setValue('category', type)}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: 6, backgroundColor: PlaceCategoryColorCode[type] }} />
                    <Typography>{PlaceCategoryTypeLabel[type]}</Typography>
                  </Stack>
                </PopMenu.Item>
              ))}
            </>
          )}
        />
      </Stack>

      <Controller
        control={control}
        name="memo"
        render={({ field }) => (
          <TextField
            placeholder="메모"
            fullWidth
            multiline
            minRows={3}
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          태그
        </Typography>
        <TextField
          placeholder="입력 후 엔터"
          fullWidth
          variant="standard"
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={() => {
            const next = tagInput.trim()
            if (next === '' || tags.includes(next)) return
            setValue('tags', [...tags, next])
            setTagInput('')
          }}
        />
        {tags.length > 0 && (
          <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => setValue('tags', tags.filter((x) => x !== tag))}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
})
