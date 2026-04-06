import { Box, type BoxProps, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { statisticsToneStyles, type StatisticsTone } from './statistics.constants'

interface StatisticsSummaryCardProps extends BoxProps {
  label: string
  value: string
  caption?: string
  tone?: StatisticsTone
  icon?: ReactNode
}

export function StatisticsSummaryCard({
  label,
  value,
  caption,
  tone = 'blue',
  icon,
  sx,
  ...boxProps
}: StatisticsSummaryCardProps) {
  const colors = statisticsToneStyles[tone]

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: colors.border,
        backgroundColor: colors.bg,
        minWidth: 0,
        ...sx,
      }}
      {...boxProps}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {icon}
      </Stack>
      <Typography mt={1} fontSize={{ xs: 20, md: 22 }} fontWeight={800} lineHeight={1.1}>
        {value}
      </Typography>
      {caption && (
        <Typography mt={0.75} variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Box>
  )
}
