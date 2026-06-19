import AddIcon from '@mui/icons-material/Add'
import { Box, Container, Fab, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { generatePath, Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useRouteOverlay } from '~shared/hooks/extends/useRouteOverlay'
import { useIsMounted } from '~shared/hooks/useIsMounted'
import { PostCard } from './PostCard'
import { PostMenu } from './PostMenu'
import { PostScreen } from './PostScreen'
import { useFeed } from './useFeed'

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

  const isMounted = useIsMounted();
  const { Link: PostLink } = useRouteOverlay(
    (postId: string) => generatePath(AppRoute.포스트_상세, { postId }),
    ({ isOpen, close, data: postId }) => (
      <FullScreenPopup transition={{ duration: isMounted ? 250 : 0 }} isOpen={isOpen} onClose={close}>
        <TopNavigation
          leftElement={<TopNavigation.BackButton onClick={close} />}
          rightElement={<PostMenu postId={postId} onDelete={close} />}
          sx={{ position: 'sticky', borderBottom: 'none', bgcolor: 'transparent' }}
        />
        <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
          <PostScreen postId={postId} />
        </Container>
      </FullScreenPopup>
    )
  )

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <PostLink key={post.id} data={post.id}>
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