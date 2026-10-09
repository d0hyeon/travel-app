import { Box, Chip, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { RoutePlaceInfoFields } from './RoutePlaceInfoFields'
import { RoutePlaceScheduleFields } from './RoutePlaceScheduleFields'
import type { RoutePlaceEditTab, useRoutePlaceEditForm } from './useRoutePlaceEditForm'

const TAB_CONTENT_MIN_HEIGHT = 252

const EDIT_TABS: { value: RoutePlaceEditTab; label: string }[] = [
  { value: 'schedule', label: '일정' },
  { value: 'place', label: '장소 정보' },
]

interface Props {
  formId: string
  form: ReturnType<typeof useRoutePlaceEditForm>
}

export function RoutePlaceEditBody({ formId, form: { place, control, tab, setTab, submit } }: Props) {
  return (
    <Stack component="form" id={formId} onSubmit={submit} spacing={2}>
      <Stack direction="row" gap={1}>
        <a href={`https://search.naver.com/search.naver?query=${place.name}`} target="_blank">
          <Chip label="네이버" variant="outlined" size="small" sx={{ fontSize: 11 }} />
        </a>
        <a href={`https://www.instagram.com/explore/search/keyword/?q=${place.name.replaceAll(' ', '')}`} target="_blank">
          <Chip label="인스타" variant="outlined" size="small" sx={{ fontSize: 11 }} />
        </a>
        <a href={`https://www.google.com/search?q=${place.name}`} target="_blank">
          <Chip label="구글" variant="outlined" size="small" sx={{ fontSize: 11 }} />
        </a>
      </Stack>

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={tab}
        onChange={(_, next: RoutePlaceEditTab | null) => next != null && setTab(next)}
        sx={{
          padding: '4px',
          gap: '4px',
          backgroundColor: '#F1F3F5',
          borderRadius: '10px',
          '& .MuiToggleButton-root': {
            border: 0,
            borderRadius: '8px !important',
            minHeight: 0,
            padding: '8px',
            fontSize: 14,
            lineHeight: '20px',
            fontWeight: 600,
            color: '#8A8F97',
          },
          '& .MuiToggleButton-root.Mui-selected': {
            color: '#1D1F23',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {EDIT_TABS.map(({ value, label }) => (
          <ToggleButton key={value} value={value}>{label}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box minHeight={TAB_CONTENT_MIN_HEIGHT}>
        <Box display={tab === 'schedule' ? 'block' : 'none'}>
          <RoutePlaceScheduleFields control={control} />
        </Box>
        <Box display={tab === 'place' ? 'block' : 'none'}>
          <RoutePlaceInfoFields control={control} />
        </Box>
      </Box>
    </Stack>
  )
}
