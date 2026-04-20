import { Box, Chip, Stack, Tooltip, type StackProps, Typography } from '@mui/material'
import { statisticsToneStyles, type StatisticsTone } from './statistics.constants'

interface StatisticsBarChartProps extends StackProps {
  label: string
  labelTooltip?: string
  labelTooltipOpen?: boolean
  value: string
  ratio: number
  helper?: React.ReactNode
  chips?: string[]
  tone?: StatisticsTone
  onLabelClick?: () => void
}

export function StatisticsBarChart({
  label,
  labelTooltip,
  labelTooltipOpen,
  value,
  ratio,
  helper,
  chips,
  tone = 'blue',
  onLabelClick,
  sx,
  ...stackProps
}: StatisticsBarChartProps) {
  const colors = statisticsToneStyles[tone]

  return (
    <Stack gap={0.8} sx={sx} {...stackProps}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
        <Tooltip
          title={labelTooltip ?? ''}
          open={labelTooltipOpen}
          placement="top-start"
          arrow
        >
          <Typography
            fontSize={12}
            fontWeight={800}
            noWrap
            onClick={onLabelClick}
            sx={{ cursor: onLabelClick ? 'pointer' : undefined }}
          >
            {label}
          </Typography>
        </Tooltip>
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
