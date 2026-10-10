import { StyleSheet } from 'react-native'
import {
  PlaceCategoryColorCode,
  PlaceCategoryTypeLabel,
  PlaceCategoryTypes,
  type PlaceCategoryType,
} from '@waylog/domains/modules/place'
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Box, Chip, Stack, TextField, Typography } from '~shared/components/design-system'
import { PopMenu } from '~shared/components/PopMenu'
import { usePreservedCallback } from '@waylog/react'

export interface PlaceFormValues {
  name: string
  address: string
  /** null은 미설정 */
  category: PlaceCategoryType | null
  memo: string
}

export interface PlaceFormRef {
  submit: () => void
}

interface Props {
  defaultValues?: Partial<PlaceFormValues>
  onSubmit?: (data: PlaceFormValues) => void;
  readonly?: boolean;
}

// 웹 PlaceForm 과 같은 값 모양을 유지한다.
export const PlaceForm = forwardRef<PlaceFormRef, Props>(function PlaceForm(
  { defaultValues, readonly = false, ...props },
  ref,
) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm<PlaceFormValues>({
    defaultValues: {
      name: '',
      address: '',
      category: null,
      memo: '',
      ...defaultValues,
    },
  })

  const category = watch('category')

  const preservedOnSubmit = usePreservedCallback((data) => props.onSubmit?.(data));

  const submit = useCallback(
    handleSubmit((data) => preservedOnSubmit(data)),
    [handleSubmit]
  )

  useImperativeHandle(
    ref,
    () => ({ submit }),
    [submit]
  )

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
                    <Box style={[styles.categoryDot, { backgroundColor: PlaceCategoryColorCode[type] }]} />
                    <Typography variant="body2">{PlaceCategoryTypeLabel[type]}</Typography>
                  </Stack>
                </PopMenu.Item>
              ))}
            </>
          )}
        />
      </Stack>

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          메모
        </Typography>

        <Controller
          control={control}
          name="memo"
          render={({ field }) => (
            <TextField
              placeholder="메모"
              fullWidth
              multiline
              minRows={4}
              value={field.value}
              onChangeText={field.onChange}
              readOnly={readonly}
            />
          )}
        />
      </Stack>

      
    </Stack>
  )
})

const styles = StyleSheet.create({
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  categories: { flexWrap: 'wrap' },
})
