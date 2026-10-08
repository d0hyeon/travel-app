import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { PlaceCategoryColorCode, PlaceCategoryTypeLabel, PlaceCategoryTypes } from '@waylog/domains/modules/place'
import { Controller, type Control } from 'react-hook-form'
import type { RoutePlaceFormValues } from './routePlaceForm.types'

interface Props {
  control: Control<RoutePlaceFormValues>
}

export function RoutePlaceInfoFields({ control }: Props) {
  return (
    <Stack spacing={2}>
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <FormControl fullWidth size="small">
            <InputLabel>카테고리</InputLabel>
            <Select label="카테고리" {...field}>
              <MenuItem value="none"><em>선택 안함</em></MenuItem>
              {PlaceCategoryTypes.map((category) => (
                <MenuItem key={category} value={category}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PlaceCategoryColorCode[category] }} />
                    {PlaceCategoryTypeLabel[category]}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="placeMemo"
        render={({ field }) => (
          <TextField {...field} label="장소 메모" multiline minRows={3} fullWidth size="small" />
        )}
      />
    </Stack>
  )
}
