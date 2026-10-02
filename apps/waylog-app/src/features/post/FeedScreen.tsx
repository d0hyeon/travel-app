import { useAuth } from '@waylog/domains/clients'
import { useFeed } from '@waylog/domains/modules/post'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense } from 'react'
import { StyleSheet, ScrollView, FlatList } from 'react-native'
import { Box, Fab, Stack, Typography } from '~/shared/components/design-system'
import { useAppNavigation } from '../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../app/AppRoute'
import { palette } from '../../shared/config/tokens'
import { PostCard } from './PostCard'
import { View } from 'tamagui'

export function FeedScreen() {
  const navigation = useAppNavigation()
  const insets = useSafeAreaInsets()
  const { data: auth } = useAuth({ required: false })
  const isSignedIn = auth != null

  return (
    <Box style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Typography variant="h5" style={styles.title}>
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
      </View>
      {isSignedIn && (
        <Fab onPress={() => navigation.navigate(AppRoute.포스트_생성, {})} style={styles.createButton}><MaterialIcons name="add" size={30} color="#fff" /></Fab>
      )}
    </Box>
  )
}

function Contents() {
  const { data: posts } = useFeed()
  const navigation = useAppNavigation()

  const openPost = (postId: string) => {
    navigation.navigate(AppRoute.포스트_상세, { postId })
  }
  const insets = useSafeAreaInsets()
  if (posts.length === 0) {
    return (
      <Box style={styles.emptyState}>
        <Typography style={styles.emptyMessage}>아직 포스트가 없어요</Typography>
      </Box>
    )
  }

  return (
    <FlatList
      contentContainerStyle={[styles.posts, { paddingBottom: insets.bottom + 96 }]}
      data={posts}
      keyExtractor={post => post.id}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <PostCard key={item.id} post={item} onPress={() => openPost(item.id)} />
      )}
    />
  )


}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F8' },
  createButton: { position: 'absolute', right: 20, bottom: 20 },
  content: { paddingHorizontal: 16, flex: 1 },
  title: { color: palette.text, paddingVertical: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyMessage: { color: palette.textSecondary, fontSize: 14 },
  posts: { gap: 16, },
})
