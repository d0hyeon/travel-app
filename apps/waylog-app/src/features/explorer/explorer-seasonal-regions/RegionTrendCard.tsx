import { MaterialIcons } from '@expo/vector-icons'
import { LocationRegion } from '@waylog/domains/modules/location'
import type { RegionTourismTrend } from '@waylog/domains/modules/tourism-trend'
import { formatKoreanCount } from '@waylog/utility'
import { StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'

interface RegionTrendCardProps {
  trend: RegionTourismTrend
  rank: number
}

export function RegionTrendCard({ trend, rank }: RegionTrendCardProps) {
  const isRising = trend.visitorGrowth >= 0
  const trendColor = isRising ? 'primary' : 'text.secondary'
  const growthPercent = Math.round(Math.abs(trend.growthRate) * 100)
  const regionLabel = getRegionLabel(trend.location)

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.rankBadge}>
          <Typography variant="caption" fontWeight="bold" color="#fff" style={styles.rankLabel}>
            {rank}
          </Typography>
        </View>
        <Typography variant="subtitle1" fontWeight="bold" numberOfLines={1}>
          {trend.location}
        </Typography>
        {regionLabel != null && (
          <Typography variant="caption" color="text.secondary" numberOfLines={1}>
            {regionLabel}
          </Typography>
        )}
      </View>

      <View style={styles.statistics}>
        <MaterialIcons name={isRising ? 'trending-up' : 'trending-down'} size={20} color={isRising ? palette.primary : palette.textSecondary} />
        <Typography variant="h6" fontWeight="bold" color={trendColor}>
          {isRising ? '+' : '-'}
          {growthPercent}%
        </Typography>
      </View>

      <Typography variant="caption" color="text.secondary" numberOfLines={1}>
        {formatKoreanCount(Math.abs(trend.visitorGrowth))}명 {isRising ? '증가' : '감소'}
      </Typography>

      <Typography variant="caption" color="text.secondary" numberOfLines={1} style={styles.description}>
        {formatKoreanCount(trend.visitorCount)}명 방문
      </Typography>
    </View>
  )
}

// 광역시는 지역명과 상위 지역이 같고(서울/서울), 제주는 포함 관계라 중복이다.
function getRegionLabel(location: RegionTourismTrend['location']) {
  const region = LocationRegion[location]
  if (region === location) return null
  if (region.startsWith(location)) return null
  return region
}

const styles = StyleSheet.create({
  card: { padding: 16, minHeight: 180, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.divider, backgroundColor: palette.background },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  rankLabel: { fontSize: 11 },
  statistics: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  description: { marginTop: 'auto', paddingTop: 8 },
})
