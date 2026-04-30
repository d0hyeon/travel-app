import { Box, Container, Typography } from '@mui/material'
import { useParams } from 'react-router'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { PostDetail } from './PostDetail'
import { usePost } from './usePost'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  if (!postId) throw new Error('postId가 필요해요')

  const { data: post } = usePost(postId)
  if (!post) {
    return (
      <Box p={3}>
        <Typography>포스트를 찾을 수 없어요</Typography>
      </Box>
    )
  }

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <TopNavigation position="relative">
          <Typography variant="body2">포스트</Typography>
        </TopNavigation>
        <PostDetail post={post} />
      </Container>
    </Box>
  )
}
