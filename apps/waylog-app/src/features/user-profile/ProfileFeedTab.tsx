import { StyleSheet, Pressable, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Typography } from '~/shared/components/design-system'
import { LoadableImage } from '../../shared/components/LoadableImage'
import { useUserPostPhotos } from './useUserPostPhotos'

export function ProfileFeedTab({ userId }: { userId: string }) {
  const { data: posts } = useUserPostPhotos(userId)
  const { width } = useWindowDimensions()
  const router = useRouter()
  const cellSize = (width - 4) / 3

  if (posts.length === 0) return <View style={styles.emptyState}><Typography variant="body2" color="text.secondary">아직 포스트가 없어요</Typography></View>

  return (
    <View style={styles.photoGrid}>
      {posts.map((post) => (
        <Pressable key={post.postId} onPress={() => router.push(`/post/${post.postId}`)}>
          <LoadableImage source={{ uri: post.url }} style={{ width: cellSize, height: cellSize }} resizeMode="cover" />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
})
