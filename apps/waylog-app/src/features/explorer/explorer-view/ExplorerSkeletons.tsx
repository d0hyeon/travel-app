import { useWindowDimensions, View } from 'react-native'
import { Skeleton } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'

export function ExplorerPlaceCardSectionSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      <Skeleton width={140} height={28} style={{ marginHorizontal: 16 }} />
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, overflow: 'hidden' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={{ width: 160, flexShrink: 0, overflow: 'hidden', borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg }}>
            <Skeleton variant="rectangular" width="100%" height={160} />
            <View style={{ padding: 12, gap: 6 }}>
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
      <Skeleton width={180} height={28} style={{ marginHorizontal: 16, marginBottom: 12 }} />
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Skeleton variant="rounded" width={64} height={64} />
          <View style={{ flex: 1, gap: 6 }}>
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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 }}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={{ width: cardWidth, overflow: 'hidden', borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg }}>
          <Skeleton variant="rectangular" width="100%" height={cardWidth} />
          <View style={{ padding: 12, gap: 6 }}>
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
