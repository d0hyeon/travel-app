import { Box, Container } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { assert } from '~shared/utils/types'
import { PostMenu } from './PostMenu'
import { PostScreen } from './PostScreen'

export default function PostDetailPage() {
  const postId = usePostId();
  const navigate = useNavigate();

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
          rightElement={
            <PostMenu postId={postId} onDelete={() => navigate(-1)} />
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
