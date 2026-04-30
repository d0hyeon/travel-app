import { Box, Container, Typography } from '@mui/material'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { PostFeed } from './PostFeed'
import { usePublicFeed } from './usePublicFeed'

export default function FeedPage() {
  const { data: posts } = usePublicFeed()

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <TopNavigation position="relative">
          <Typography variant="body2">피드</Typography>
        </TopNavigation>
        <Box px={2} py={2}>
          <PostFeed posts={posts} emptyMessage="공개된 포스트가 아직 없어요" />
        </Box>
      </Container>
    </Box>
  )
}
