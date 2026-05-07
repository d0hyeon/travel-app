import { Box, Container } from '@mui/material'
import { useParams } from 'react-router'
import { UserProfile } from '~features/user-profile/UserProfile'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { assert } from '~shared/utils/types'
import { PostScreen } from './PostScreen'
import { usePost } from './usePost'

export default function PostDetailPage() {
  const postId = usePostId();

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
        <TopNavigation
          position="sticky"
          borderBottom="none !important"
          bgcolor="transparent !important"
          leftElement={
            <TopNavigation.BackButton />
          }
        />

        <PostScreen postId={postId} />
      </Container>
    </Box>
  )
}

function usePostId() {
  const { postId } = useParams<{ postId?: string }>()
  assert(!!postId, '잘못된 접근입니다.');

  return postId;
}
