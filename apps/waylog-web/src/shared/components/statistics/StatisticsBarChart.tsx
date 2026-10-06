import { Box, Chip, ClickAwayListener, Stack, Tooltip, type StackProps, Typography } from '@mui/material'
import { useState } from 'react'
import { statisticsToneStyles, type StatisticsTone } from './statistics.constants'

interface StatisticsBarChartProps extends StackProps {
  label: string
  labelTooltip?: string
  value: string
  ratio: number
  helper?: React.ReactNode
  chips?: string[]
  tone?: StatisticsTone
}

export function StatisticsBarChart({
  label,
  labelTooltip,
  value,
  ratio,
  helper,
  chips,
  tone = 'blue',
  sx,
  ...stackProps
}: StatisticsBarChartProps) {
  const colors = statisticsToneStyles[tone]
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <Stack gap={0.8} sx={sx} {...stackProps}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
        <ClickAwayListener onClickAway={() => setTooltipOpen(false)}>
          <Tooltip
            title={labelTooltip ?? ''}
            open={labelTooltip ? tooltipOpen : false}
            placement="top-start"
            arrow
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <Typography
              fontSize={12}
              fontWeight={800}
              noWrap
              onClick={labelTooltip ? () => setTooltipOpen((prev) => !prev) : undefined}
              sx={{ cursor: labelTooltip ? 'pointer' : undefined }}
            >
              {label}
            </Typography>
          </Tooltip>
        </ClickAwayListener>
        <Typography fontSize={12} fontWeight={800} sx={{ color: colors.fill }} flexShrink={0}>
          {value}
        </Typography>
      </Stack>
      <Box
        sx={{
          width: '100%',
          height: 10,
          borderRadius: 999,
          backgroundColor: colors.soft,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.max(ratio * 100, 6)}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: colors.fill,
          }}
        />
      </Box>
      {(helper || chips) && (
        <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
          {helper && (
            <Typography component="div" variant="caption" color="text.secondary">
              {helper}
            </Typography>
          )}
          {chips?.map((chip, index) => (
            <Chip key={`${chip}-${index}`} label={chip} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
