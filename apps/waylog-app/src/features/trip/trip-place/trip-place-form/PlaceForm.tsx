import {
  PlaceCategoryColorCode,
  PlaceCategoryTypeLabel,
  PlaceCategoryTypes,
  type PlaceCategoryType,
} from '@waylog/domains/place'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Chip, Stack, TextField, Typography } from '../../../../shared/components/mui'

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
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field }) => (
          <TextField
            placeholder="장소 이름"
            fullWidth
            variant="standard"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          카테고리
        </Typography>
        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
          {PlaceCategoryTypes.map((type) => (
            <Chip
              key={type}
              label={PlaceCategoryTypeLabel[type]}
              size="small"
              variant={category === type ? 'filled' : 'outlined'}
              onClick={() => setValue('category', category === type ? null : type)}
              sx={category === type ? { backgroundColor: PlaceCategoryColorCode[type] } : undefined}
            />
          ))}
        </Stack>
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
