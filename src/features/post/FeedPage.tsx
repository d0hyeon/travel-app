import { Box, Container, Typography } from '@mui/material'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { PostFeed } from './PostFeed'

export default function FeedPage() {

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <Box py={2}>
          <PostFeed />
        </Box>
      </Container>
    </Box>
  )
}
