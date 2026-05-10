import AddIcon from '@mui/icons-material/Add'
import { Box, Container, Fab } from '@mui/material'
import { Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { PostFeed } from './PostFeed'

export default function FeedPage() {

  return (
    <Box display="flex" flexDirection="column" position="relative">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <Box py={2}>
          <PostFeed />
        </Box>
      </Container>
      <Fab
        color="primary"
        component={Link}
        to={AppRoute.포스트_생성}
        aria-label="새 포스트"
        sx={{ position: 'fixed', right: 16, bottom: 80 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}
