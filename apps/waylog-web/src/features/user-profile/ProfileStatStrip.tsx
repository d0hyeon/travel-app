import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useUserPhotos } from './useUserPhotos'
import { useUserTrips } from './useUserTrips'
import { countUniqueCountries } from './user-profile.utils'

interface Props {
  userId: string
}

export function ProfileStatStrip({ userId }: Props) {
  const { data: trips } = useUserTrips(userId)
  const { data: photos } = useUserPhotos(userId)

  const countries = useMemo(() => countUniqueCountries(trips), [trips])

  return (
    <Box mx={2} bgcolor="#f5f5f7" borderRadius="12px" p={0.5}>
      <Stack direction="row" gap={0.25}>
        <StatCell value={trips.length} label="여행" />
        <StatCell value={countries} label="나라" />
        <StatCell value={photos.length.toLocaleString()} label="사진" />
      </Stack>
    </Box>
  )
}

interface StatCellProps {
  value: number | string
  label: string
}

function StatCell({ value, label }: StatCellProps) {
  return (
    <Stack flex={1} alignItems="center" sx={{ py: 1, px: 0.5 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: '#6b6b73' }}>
        {label}
      </Typography>
    </Stack>
  )
}
