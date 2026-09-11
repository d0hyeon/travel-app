import { SeasonLabel, useRegionTourismTrends } from '@waylog/domains/modules/tourism-trend'
import { useRouter } from 'expo-router'
import { StyleSheet, Pressable, ScrollView, View } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { RegionTrendCard } from './RegionTrendCard'

const SECTION_LIMIT = 20

export function SeasonalRegionsSummarySection() {
  const { data: trends, season, referenceYear } = useRegionTourismTrends()
  const topTrends = trends.slice(0, SECTION_LIMIT)
  const { setLocation } = useExplorerFilterParams()
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Typography variant="subtitle1">이번 {SeasonLabel[season]} 국내 인기 여행지</Typography>
        <Typography variant="caption" color="text.secondary">
          {referenceYear}년 {SeasonLabel[season]} 기준
        </Typography>
      </View>

      {topTrends.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body2" color="text.secondary">자료를 찾을 수 없어요</Typography>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionsContent}
        >
          {topTrends.map((trend, index) => (
            <Pressable
              key={trend.location}
              onPress={() => setLocation(trend.location)}
              style={styles.regionCard}
            >
              <RegionTrendCard trend={trend} rank={index + 1} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export function SeasonalRegionsSummarySectionSkeleton() {
  return (
    <View style={styles.skeleton}>
      <Skeleton width={200} height={28} style={styles.skeletonTitle} />
      <View style={styles.skeletonCards}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.skeletonCard}>
            <View style={styles.skeletonHeading}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton width="55%" height={24} />
            </View>
            <Skeleton width="45%" height={32} />
            <Skeleton width="60%" height={16} />
            <Skeleton width="55%" height={16} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { flex: 0, minHeight: 0 },
  header: { paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  emptyState: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 32 },
  regionsContent: { paddingHorizontal: 16, gap: 12, alignItems: 'flex-start' },
  regionCard: { width: 150 },
  skeleton: { gap: 12 },
  skeletonTitle: { marginHorizontal: 16 },
  skeletonCards: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, overflow: 'hidden' },
  skeletonCard: { width: 150, flexShrink: 0, padding: 16, gap: 8, borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg },
  skeletonHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})
