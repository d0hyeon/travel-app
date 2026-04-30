import { Box, Container, Typography } from '@mui/material'
import { useParams } from 'react-router'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { PostFeed } from './PostFeed'
import { useUserFeed } from './useUserFeed'

export default function UserFeedPage() {
  const { userId } = useParams<{ userId: string }>()
  if (!userId) throw new Error('userId가 필요해요')

  const { data: posts } = useUserFeed(userId)

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <TopNavigation position="relative">
          <Typography variant="body2">사용자 포스트</Typography>
        </TopNavigation>
        <Box px={2} py={2}>
          <PostFeed posts={posts} emptyMessage="이 사용자의 포스트가 없어요" />
        </Box>
      </Container>
    </Box>
  )
}
