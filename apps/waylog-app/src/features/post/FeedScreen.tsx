import { useFeed } from '@waylog/domains/modules/post'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { ScrollView } from 'react-native'
import { Box, Fab, Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { PostCard } from './PostCard'

export function FeedScreen() {
  const { data: posts } = useFeed()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const openPost = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        <Typography sx={{ color: palette.text, fontSize: 20, fontWeight: '900', paddingVertical: 18 }}>
          피드
        </Typography>
        {posts.length === 0 ? (
          <Box sx={{ alignItems: 'center', paddingVertical: 80 }}>
            <Typography sx={{ color: palette.textSecondary, fontSize: 14 }}>아직 포스트가 없어요</Typography>
          </Box>
        ) : (
          <Stack sx={{ gap: 16 }}>
            {posts.map((post) => <PostCard key={post.id} post={post} onPress={() => openPost(post.id)} />)}
          </Stack>
        )}
      </ScrollView>
      <Fab size="large" onClick={() => router.push('/post/new')} sx={{ position: 'absolute', right: 20, bottom: 20 }}><MaterialIcons name="add" size={30} color="#fff" /></Fab>
    </Box>
  )
}
