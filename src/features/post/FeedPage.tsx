import AddIcon from '@mui/icons-material/Add'
import { Box, Container, Fab, Typography } from '@mui/material'
import { Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { PostFeed } from './PostFeed'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

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
          <PostFeed />
        </Container>
      </Box>
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

function Header() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <TopNavigation leftElement={null} position="sticky">
        <Typography variant="body1" fontWeight={800} paddingX={1}>
          피드
        </Typography>
      </TopNavigation>
    )
  }

  return (
    <DesktopNavigation leftElement={null} position="sticky">
      <Typography variant="h6" fontWeight={800} paddingX={1}>
        피드
      </Typography>
    </DesktopNavigation>
  )
}