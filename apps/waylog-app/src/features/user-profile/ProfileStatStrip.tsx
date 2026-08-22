import { useMemo } from 'react'
import { Stack, Typography } from '../../shared/components/mui'
import { palette, radius } from '../../shared/config/tokens'
import { countUniqueCountries } from './user-profile.utils'
import { useUserPhotos } from './useUserPhotos'
import { useUserTrips } from './useUserTrips'

export function ProfileStatStrip({ userId }: { userId: string }) {
  const { data: trips } = useUserTrips(userId)
  const { data: photos } = useUserPhotos(userId)
  const countryCount = useMemo(() => countUniqueCountries(trips), [trips])

  return (
    <Stack direction="row" gap={2} sx={{ marginHorizontal: 16, padding: 4, borderRadius: radius.lg, backgroundColor: '#f5f5f7' }}>
      <StatCell value={trips.length} label="여행" />
      <StatCell value={countryCount} label="나라" />
      <StatCell value={photos.length.toLocaleString()} label="사진" />
    </Stack>
  )
}

function StatCell({ value, label }: { value: number | string; label: string }) {
  return <Stack flex={1} alignItems="center" gap={2} sx={{ paddingVertical: 8 }}><Typography sx={{ fontSize: 16, fontWeight: 'bold', color: palette.text }}>{value}</Typography><Typography variant="caption" color="text.secondary">{label}</Typography></Stack>
}
