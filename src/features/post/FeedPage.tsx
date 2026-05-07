import { Box, Container } from '@mui/material'
import { PostFeed } from './PostFeed'

export default function FeedPage() {

  return (
    <Box display="flex" flexDirection="column">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <Box py={2}>
          <PostFeed />
        </Box>
      </Container>
    </Box>
  )
}
