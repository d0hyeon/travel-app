import { StyleSheet } from 'react-native'
import { useMemo } from 'react'
import { Skeleton, Stack, Typography } from '~shared/components/design-system'
import { palette, radius } from '~shared/config/tokens'
import { useUserTrips } from './useUserTrips'
import { countUniqueCountries, countUniqueRegions } from '@waylog/domains/modules/trip'

export function ProfileStatStrip({ userId }: { userId: string }) {
  const { data: trips } = useUserTrips(userId)

  const [countryCount, regionCount] = useMemo(() => [
    countUniqueCountries(trips),
    countUniqueRegions(trips)
  ], [trips])


  return (
    <Stack direction="row" gap={2} style={styles.statistics}>
      <StatCell value={trips.length} label="여행" />
      <StatCell value={countryCount} label="국가" />
      <StatCell value={regionCount.toLocaleString()} label="지역" />
    </Stack>
  )
}

function StatCell({ value, label }: { value: number | string; label: string }) {
  return (
    <Stack flex={1} alignItems="center" gap={1} style={styles.statistic}>
      <Typography style={styles.count}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  )
}

ProfileStatStrip.Skeleton = function ProfileStatStripSkeleton() {
  return (
    <Stack direction="row" gap={2} style={styles.statistics}>
      {Array.from({ length: STAT_CELL_COUNT }, (_, index) => (
        <Stack key={index} flex={1} alignItems="center" gap={1} style={styles.statistic}>
          <Skeleton width={24} height={20} />
          <Skeleton width={32} height={14} />
        </Stack>
      ))}
    </Stack>
  )
}

const STAT_CELL_COUNT = 3

const styles = StyleSheet.create({
  statistics: { marginHorizontal: 16, padding: 4, borderRadius: radius.lg, backgroundColor: '#f5f5f7' },
  statistic: { paddingVertical: 8 },
  count: { fontSize: 16, fontWeight: 'bold', color: palette.text },
})
