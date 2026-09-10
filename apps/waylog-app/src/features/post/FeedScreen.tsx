import { useFeed } from '@waylog/domains/modules/post'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense } from 'react'
import { StyleSheet, ScrollView } from 'react-native'
import { Box, Fab, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../shared/config/tokens'
import { PostCard } from './PostCard'

export function FeedScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <Box style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography style={styles.title}>
          피드
        </Typography>
        <Suspense
          fallback={
            <Stack style={styles.posts}>
              <PostCard.Skeleton />
              <PostCard.Skeleton />
              <PostCard.Skeleton />
            </Stack>
          }
        >
          <Contents />
        </Suspense>
      </ScrollView>
      <Fab size="large" onPress={() => router.push('/post/new')} style={styles.createButton}><MaterialIcons name="add" size={30} color="#fff" /></Fab>
    </Box>
  )
}

function Contents() {
  const { data: posts } = useFeed()
  const router = useRouter()

  const openPost = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  if (posts.length === 0) {
    return (
      <Box style={styles.emptyState}>
        <Typography style={styles.emptyMessage}>아직 포스트가 없어요</Typography>
      </Box>
    )
  }

  return (
    <Stack style={styles.posts}>
      {posts.map((post) => <PostCard key={post.id} post={post} onPress={() => openPost(post.id)} />)}
    </Stack>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F8' },
  createButton: { position: 'absolute', right: 20, bottom: 20 },
  content: { paddingHorizontal: 16 },
  title: { color: palette.text, fontSize: 20, fontWeight: '900', paddingVertical: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyMessage: { color: palette.textSecondary, fontSize: 14 },
  posts: { gap: 16 },
})
