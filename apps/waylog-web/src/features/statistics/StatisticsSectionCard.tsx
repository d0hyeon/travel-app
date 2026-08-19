import { Box, type BoxProps, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { statisticsToneStyles, type StatisticsTone } from '~shared/components/statistics/statistics.constants'

interface StatisticsSectionCardProps extends BoxProps {
  title: string
  tone?: StatisticsTone
  action?: ReactNode
  children: ReactNode
}

export function StatisticsSectionCard({
  title,
  tone = 'blue',
  action,
  children,
  sx,
  ...boxProps
}: StatisticsSectionCardProps) {
  const colors = statisticsToneStyles[tone]

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: colors.border,
        backgroundColor: '#fff',
        ...sx,
      }}
      {...boxProps}
    >
      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography fontSize={14} fontWeight={800}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Box>
  )
}
