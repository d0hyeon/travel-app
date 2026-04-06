import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import { Box, IconButton, Popover, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { BottomSheet } from '~shared/components/BottomSheet'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { useStorageState } from '~shared/hooks/useStorageState'

export type StatisticsChartViewMode = 'horizontal-bar' | 'vertical-bar' | 'donut' | 'line' | 'bar'

export interface StatisticsViewModeOption {
  value: StatisticsChartViewMode
  label: string
  caption: string
}

interface StatisticsViewConfigButtonProps {
  title: string
  options: StatisticsViewModeOption[]
  value: StatisticsChartViewMode
  onChange: (value: StatisticsChartViewMode) => void
}

export function useStatisticsChartViewMode(
  storageKey: string,
  defaultValue: StatisticsChartViewMode,
) {
  return useStorageState<StatisticsChartViewMode>(`statistics-view:${storageKey}`, defaultValue)
}

export function StatisticsViewConfigButton({
  title,
  options,
  value,
  onChange,
}: StatisticsViewConfigButtonProps) {
  const isMobile = useIsMobile()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const overlay = useOverlay()

  return (
    <>
      <IconButton
        size="small"
        aria-label={`${title} 보기 설정`}
        onClick={(event) => {
          if (isMobile) {
            overlay.open(({ isOpen, close }) => (
              <BottomSheet isOpen={isOpen} onClose={close}>
                <BottomSheet.Header>{title} 설정</BottomSheet.Header>
                <BottomSheet.Body>
                  <BottomSheet.Scrollable>
                    <StatisticsViewConfigPanel
                      options={options}
                      value={value}
                      onChange={(nextValue) => {
                        onChange(nextValue)
                        close()
                      }}
                    />
                  </BottomSheet.Scrollable>
                </BottomSheet.Body>
              </BottomSheet>
            ))
            return
          }
          setAnchorEl(event.currentTarget)
        }}
        sx={{
          width: 28,
          height: 28,
        }}
      >
        <SettingsRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>

      {!isMobile && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                borderRadius: 3,
                border: '1px solid #ececec',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                minWidth: 320,
              },
            },
          }}
        >
          <StatisticsViewConfigPanel
            options={options}
            value={value}
            onChange={(nextValue) => {
              onChange(nextValue)
              setAnchorEl(null)
            }}
          />
        </Popover>
      )}
    </>
  )
}

function StatisticsViewConfigPanel({
  options,
  value,
  onChange,
}: Pick<StatisticsViewConfigButtonProps, 'options' | 'value' | 'onChange'>) {
  const isMobile = useIsMobile()

  return (
    <Stack gap={1} marginTop={1}>
      <Typography fontSize={12} fontWeight={700} color="text.secondary">
        그래프 유형
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(4, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {options.map((option) => (
          <Box
            key={option.value}
            onClick={() => onChange(option.value)}
            sx={{
              border: '1px solid',
              borderColor: option.value === value ? '#111' : '#e6e6e6',
              borderRadius: 3,
              p: { xs: 0.75, md: 1.25 },
              cursor: 'pointer',
              bgcolor: option.value === value ? '#fafafa' : '#fff',
            }}
          >
            <StatisticsViewModePreview mode={option.value} compact />
            <Typography mt={{ xs: 0.75, md: 1 }} fontSize={{ xs: 11, md: 13 }} fontWeight={700}>
              {option.label}
            </Typography>
            {!isMobile && (
              <Typography mt={0.25} fontSize={12} color="text.secondary">
                {option.caption}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Stack>
  )
}

function StatisticsViewModePreview({
  mode,
  compact = false,
}: {
  mode: StatisticsChartViewMode
  compact?: boolean
}) {
  if (mode === 'line') {
    return (
      <Box sx={{ height: compact ? 40 : 52, borderRadius: 2, bgcolor: '#f8fafc', p: compact ? 0.75 : 1 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', left: '8%', bottom: '18%', width: compact ? 5 : 6, height: compact ? 5 : 6, borderRadius: '50%', bgcolor: '#4C84FF' }} />
          <Box sx={{ position: 'absolute', left: '34%', bottom: '42%', width: compact ? 5 : 6, height: compact ? 5 : 6, borderRadius: '50%', bgcolor: '#4C84FF' }} />
          <Box sx={{ position: 'absolute', left: '62%', bottom: '30%', width: compact ? 5 : 6, height: compact ? 5 : 6, borderRadius: '50%', bgcolor: '#4C84FF' }} />
          <Box sx={{ position: 'absolute', left: '84%', bottom: '60%', width: compact ? 5 : 6, height: compact ? 5 : 6, borderRadius: '50%', bgcolor: '#4C84FF' }} />
          <Box sx={{ position: 'absolute', left: '10%', bottom: '22%', width: '28%', height: 2, bgcolor: '#4C84FF', transform: 'rotate(22deg)', transformOrigin: 'left center' }} />
          <Box sx={{ position: 'absolute', left: '36%', bottom: '45%', width: '28%', height: 2, bgcolor: '#4C84FF', transform: 'rotate(-12deg)', transformOrigin: 'left center' }} />
          <Box sx={{ position: 'absolute', left: '64%', bottom: '34%', width: '23%', height: 2, bgcolor: '#4C84FF', transform: 'rotate(28deg)', transformOrigin: 'left center' }} />
        </Box>
      </Box>
    )
  }

  if (mode === 'donut') {
    return (
      <Box sx={{ height: compact ? 40 : 52, borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            width: compact ? 26 : 34,
            height: compact ? 26 : 34,
            borderRadius: '50%',
            background: 'conic-gradient(#4C84FF 0 42%, #7BA7FF 42% 72%, #D1E0FF 72% 100%)',
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', inset: compact ? 6 : 8, borderRadius: '50%', bgcolor: '#fff' }} />
        </Box>
      </Box>
    )
  }

  if (mode === 'vertical-bar' || mode === 'bar') {
    const barHeights = compact ? [14, 22, 18, 30] : [18, 28, 22, 36]

    return (
      <Box sx={{ height: compact ? 40 : 52, borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', alignItems: 'flex-end', gap: compact ? 0.5 : 0.75, px: compact ? 0.75 : 1.25, py: compact ? 0.75 : 1 }}>
        {barHeights.map((height, index) => (
          <Box
            key={`${mode}-${index}`}
            sx={{
              flex: 1,
              height,
              borderRadius: '6px 6px 0 0',
              bgcolor: index % 2 === 0 ? '#4C84FF' : '#A9C4FF',
            }}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ height: compact ? 40 : 52, borderRadius: 2, bgcolor: '#f8fafc', display: 'grid', alignContent: 'center', gap: compact ? 0.5 : 0.75, px: compact ? 0.75 : 1 }}>
      {[0.85, 0.62, 0.42].map((ratio, index) => (
        <Box
          key={`horizontal-bar-${index}`}
          sx={{
            height: compact ? 6 : 8,
            width: `${ratio * 100}%`,
            borderRadius: 999,
            bgcolor: index === 0 ? '#4C84FF' : '#A9C4FF',
          }}
        />
      ))}
    </Box>
  )
}
