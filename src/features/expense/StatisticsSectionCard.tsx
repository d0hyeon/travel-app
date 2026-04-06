import { Box, type BoxProps, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { statisticsToneStyles, type StatisticsTone } from './statistics.constants'

interface StatisticsSectionCardProps extends BoxProps {
  title: string
  tone?: StatisticsTone
  children: ReactNode
}

export function StatisticsSectionCard({
  title,
  tone = 'blue',
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
      <Typography mb={2} fontSize={14} fontWeight={800}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}
