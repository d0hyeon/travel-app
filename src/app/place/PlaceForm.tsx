import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type BoxProps,
  type ButtonProps,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useState, type ReactNode } from 'react'
import { PlaceCategoryColorCode, PlaceCategoryTypeLabel, PlaceCategoryTypes, type PlaceCategoryType } from './place.types'

export interface PlaceFormValues {
  name: string;
  address: string;
  category: PlaceCategoryType | ''
  memo: string
  tags: string[]
}

export interface PlaceFormProps extends Omit<BoxProps<'form'>, 'onSubmit'> {
  defaultValues?: Partial<PlaceFormValues>;
  onSubmit: (data: PlaceFormValues) => void
  /** 폼 ref (외부에서 submit 호출 시) */
  formRef?: React.Ref<{ submit: () => void }>
  actions?: ReactNode;
}

export function PlaceForm({
  defaultValues,
  onSubmit,
  actions = false,
  ...props
}: PlaceFormProps) {
  const { control, handleSubmit, setValue, watch } = useForm<PlaceFormValues>({
    defaultValues: defaultValues,
  })

  const [tagInput, setTagInput] = useState('')
  const tags = watch('tags')

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setValue('tags', [...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data)
  })

  return (
    <Box component="form" onSubmit={handleFormSubmit} {...props}>
      <Stack spacing={2.5}>
        {/* 장소명 (읽기 전용) */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {defaultValues?.name}
          </Typography>
          {defaultValues?.address && (
            <Typography variant="body2" color="text.secondary">
              {defaultValues?.address}
            </Typography>
          )}
        </Box>

        {/* 카테고리 */}
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth size="small">
              <InputLabel>카테고리</InputLabel>
              <Select {...field} label="카테고리">
                <MenuItem value="">
                  <em>선택 안함</em>
                </MenuItem>
                {PlaceCategoryTypes.map((category) => (
                  <MenuItem key={category} value={category}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: PlaceCategoryColorCode[category],
                        }}
                      />
                      {PlaceCategoryTypeLabel[category]}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />

        {/* 메모 */}
        <Controller
          name="memo"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="메모"
              multiline
              rows={3}
              fullWidth
              size="small"
            />
          )}
        />

        {/* 태그 */}
        <Box>
          <TextField
            label="태그 추가"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            placeholder="Enter로 추가"
          />
          {tags.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1, gap: 0.5 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* 버튼 */}
        {actions && (
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

PlaceForm.SubmitButton = (props: Omit<ButtonProps, 'type'>) => {
  return (
    <Button
      {...props}
      type="submit"
      variant="contained"
    >
      저장
    </Button>
  )
}
