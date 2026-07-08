import AddIcon from '@mui/icons-material/Add'
import { Box, Container, Fab, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PostCard } from './PostCard'
import { useFeed } from './useFeed'
import { usePostOverlay } from './usePostOverlay'

export const meta = () => [
  { title: '피드 — WayLog' },
  { property: 'og:title', content: '피드 — WayLog' },
]

export default function FeedPage() {
  return (
    <Box display="flex" flexDirection="column" position="relative">
      <Header />
      <Box paddingTop={2} paddingBottom={10} sx={theme => ({ flex: 1, bgcolor: theme.palette.grey[100] })}>
        <Container
          maxWidth="sm"
          disableGutters
          sx={theme => ({ paddingX: 2, flex: 1, bgcolor: theme.palette.grey[100] })}
        >
          <Suspense>
            <Contents />
          </Suspense>
        </Container>
      </Box>
      <Fab
        color="primary"
        component={Link}
        to={AppRoute.포스트_생성}
        aria-label="새 포스트"
        sx={{ position: 'fixed', right: 16, bottom: `calc(${BottomNavigation.HEIGHT + 24}px + env(safe-area-inset-bottom))` }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

function Contents() {
  const { data: posts } = useFeed();
  const { Trigger: PostLink } = usePostOverlay()

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <PostLink key={post.id} postId={post.id}>
          <PostCard post={post} />
        </PostLink>
      ))}
    </Stack>
  )
}


const Header = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <TopNavigation leftElement={null} position="sticky">
        <Typography variant="body1" fontWeight={800} >
          피드
        </Typography>
      </TopNavigation>
    )
  }

  return (
    <DesktopNavigation leftElement={null} position="sticky">
      <Typography variant="h6" fontWeight={800}>
        피드
      </Typography>
    </DesktopNavigation>
  )
}