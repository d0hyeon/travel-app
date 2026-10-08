import {
  PlaceCategoryColorCode,
  PlaceCategoryTypeLabel,
  PlaceCategoryTypes,
} from '@waylog/domains/modules/place'
import { Controller, type Control } from 'react-hook-form'
import { StyleSheet } from 'react-native'
import { Box, Stack, TextField, Typography } from '~shared/components/design-system'
import { PopMenu } from '~shared/components/PopMenu'
import type { RoutePlaceFormValues } from './routePlaceForm.types'

interface Props {
  control: Control<RoutePlaceFormValues>
}

export function RoutePlaceInfoFields({ control }: Props) {
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          카테고리
        </Typography>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <PopMenu
              trigger={(
                <TextField
                  pointerEvents="none"
                  fullWidth
                  variant="outlined"
                  value={field.value == null ? '선택 안함' : PlaceCategoryTypeLabel[field.value]}
                  editable={false}
                />
              )}
              items={(
                <>
                  <PopMenu.Item onPress={() => field.onChange(null)}>선택 안함</PopMenu.Item>
                  {PlaceCategoryTypes.map((type) => (
                    <PopMenu.Item key={type} onPress={() => field.onChange(type)}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <Box style={[styles.categoryDot, { backgroundColor: PlaceCategoryColorCode[type] }]} />
                        <Typography variant="body2">{PlaceCategoryTypeLabel[type]}</Typography>
                      </Stack>
                    </PopMenu.Item>
                  ))}
                </>
              )}
            />
          )}
        />
      </Stack>

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          장소 메모
        </Typography>
        <Controller
          control={control}
          name="placeMemo"
          render={({ field }) => (
            <TextField
              placeholder="장소 메모"
              fullWidth
              multiline
              minRows={3}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      </Stack>
    </Stack>
  )
}

const styles = StyleSheet.create({
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
})
