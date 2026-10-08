import { LocationRegion } from '@waylog/domains/modules/location'
import type { RegionTourismTrend } from '@waylog/domains/modules/tourism-trend'
import { formatKoreanCount } from '@waylog/utility'
import { StyleSheet, View } from 'react-native'
import { Typography } from '~shared/components/design-system'
import { palette, radius } from '~shared/config/tokens'

export const REGION_TREND_CARD_INNER_DIVIDER = 'rgba(0,0,0,0.06)'

interface RegionTrendCardProps {
  trend: RegionTourismTrend
  rank: number
}

export function RegionTrendCard({ trend, rank }: RegionTrendCardProps) {
  const isRising = trend.visitorGrowth >= 0
  const trendColor = isRising ? 'primary' : 'text.secondary'
  const growthPercent = Math.round(Math.abs(trend.growthRate) * 100)
  const regionLabel = getRegionLabel(trend.location)
  const visitors = getCountParts(trend.visitorCount)
  const growth = getCountParts(Math.abs(trend.visitorGrowth))

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.rankBadge}>
          <Typography variant="caption" fontWeight="bold" color="common.white" style={styles.rankLabel}>
            {rank}
          </Typography>
        </View>
        <Typography variant="subtitle1" fontWeight="bold" numberOfLines={1} style={styles.location}>
          {trend.location}
        </Typography>
        {regionLabel != null && (
          <Typography variant="caption" color="text.secondary" numberOfLines={1} style={styles.regionLabel}>
            {regionLabel}
          </Typography>
        )}
      </View>

      <Typography variant="h6" fontWeight="bold" color={trendColor} style={styles.growthRate}>
        {isRising ? '↗ +' : '↘ -'}
        {growthPercent}%
      </Typography>

      <View style={styles.statistics}>
        <View style={styles.statistic}>
          <Typography variant="caption" color="text.secondary" style={styles.statisticLabel}>
            방문객
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" numberOfLines={1} style={styles.statisticValue}>
            {visitors.amount}
            <Typography variant="caption" color="text.secondary" style={styles.statisticUnit}>
              {visitors.unit}
            </Typography>
          </Typography>
        </View>
        <View style={[styles.statistic, styles.growthStatistic]}>
          <Typography variant="caption" color="text.secondary" style={styles.statisticLabel}>
            작년 대비
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" color={trendColor} numberOfLines={1} style={styles.statisticValue}>
            {isRising ? '+' : '-'}
            {growth.amount}
            <Typography variant="caption" color={trendColor} style={styles.statisticUnit}>
              {growth.unit}
            </Typography>
          </Typography>
        </View>
      </View>
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

function getCountParts(count: number) {
  const formatted = formatKoreanCount(count)
  const hasManUnit = formatted.endsWith('만')
  if (hasManUnit) return { amount: formatted.slice(0, -1), unit: '만명' }
  return { amount: formatted, unit: '명' }
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 12, borderRadius: radius.xl, borderWidth: 1, borderColor: palette.divider, backgroundColor: palette.background },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  rankLabel: { fontSize: 13 },
  location: { fontSize: 18, flexShrink: 1 },
  regionLabel: { fontSize: 14, flexShrink: 1 },
  growthRate: { fontSize: 22 },
  statistics: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: REGION_TREND_CARD_INNER_DIVIDER },
  statistic: { flex: 1, gap: 2 },
  growthStatistic: { paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: REGION_TREND_CARD_INNER_DIVIDER },
  statisticLabel: { fontSize: 11 },
  statisticValue: { fontSize: 17 },
  statisticUnit: { fontSize: 13 },
})
