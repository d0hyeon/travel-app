import { Box, Container } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { assert } from '~shared/utils/types'
import { PostMenu } from './PostMenu'
import { PostScreen } from './PostScreen'
import { useScrollRestore } from '~shared/hooks/interaction/useScrollRestore'

export default function PostDetailPage() {
  const postId = usePostId();
  const navigate = useNavigate();

  useScrollRestore(`post-page-${postId}`);

  return (
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
  )
}


function usePostId() {
  const { postId } = useParams<{ postId?: string }>()
  assert(!!postId, '잘못된 접근입니다.');

  return postId;
}
