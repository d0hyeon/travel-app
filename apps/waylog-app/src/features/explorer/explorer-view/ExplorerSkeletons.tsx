import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { Skeleton } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'

export function ExplorerPlaceCardSectionSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width={140} height={28} style={styles.title} />
      <View style={styles.cards}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.card}>
            <Skeleton variant="rectangular" width="100%" height={160} />
            <View style={styles.cardContent}>
              <Skeleton width="80%" height={16} />
              <Skeleton width={60} height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export function ExplorerPlaceListSectionSkeleton() {
  return (
    <View>
      <Skeleton width={180} height={28} style={styles.rankingTitle} />
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.rankingRow}>
          <Skeleton variant="rounded" width={64} height={64} />
          <View style={styles.rankingContent}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={14} />
            <Skeleton width={80} height={14} />
          </View>
        </View>
      ))}
    </View>
  )
}

export function ExplorerGridSkeleton() {
  const { width } = useWindowDimensions()
  const cardWidth = (width - 44) / 2

  return (
    <View style={styles.grid}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={[styles.gridCard, { width: cardWidth }]}>
          <Skeleton variant="rectangular" width="100%" height={cardWidth} />
          <View style={styles.cardContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width={60} height={14} />
          </View>
        </View>
      ))}
    </View>
  )
}

export function ExplorerMapSkeleton() {
  return <Skeleton variant="rectangular" width="100%" height="100%" />
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { marginHorizontal: 16 },
  cards: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, overflow: 'hidden' },
  card: { width: 160, flexShrink: 0, overflow: 'hidden', borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg },
  cardContent: { padding: 12, gap: 6 },
  rankingTitle: { marginHorizontal: 16, marginBottom: 12 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  rankingContent: { flex: 1, gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  gridCard: { overflow: 'hidden', borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg },
})
