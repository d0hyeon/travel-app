import { StyleSheet, Pressable, View, useWindowDimensions } from 'react-native'
import { Skeleton, Typography } from '~shared/components/design-system'
import { LoadableImage } from '~shared/components/LoadableImage'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { useUserPostPhotos } from './useUserPostPhotos'

export function ProfileFeedTab({ userId }: { userId: string }) {
  const { data: posts } = useUserPostPhotos(userId)
  const { width } = useWindowDimensions()
  const navigation = useAppNavigation()
  const cellSize = (width - 4) / 3

  if (posts.length === 0) return <View style={styles.emptyState}><Typography variant="body2" color="text.secondary">아직 포스트가 없어요</Typography></View>

  return (
    <View style={styles.photoGrid}>
      {posts.map((post) => (
        <Pressable key={post.postId} onPress={() => navigation.navigate(AppRoute.포스트_상세, { postId: post.postId })}>
          <LoadableImage source={{ uri: post.url }} style={{ width: cellSize, height: cellSize }} contentFit="cover" />
        </Pressable>
      ))}
    </View>
  )
}

ProfileFeedTab.Skeleton = function ProfileFeedTabSkeleton() {
  const { width } = useWindowDimensions()
  const cellSize = (width - 4) / 3

  return (
    <View style={styles.photoGrid}>
      {Array.from({ length: PENDING_CELL_COUNT }, (_, index) => (
        <Skeleton key={index} variant="rectangular" width={cellSize} height={cellSize} style={styles.pendingCell} />
      ))}
    </View>
  )
}

const PENDING_CELL_COUNT = 9

const styles = StyleSheet.create({
  pendingCell: { borderRadius: 0 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
})
