import AddIcon from '@mui/icons-material/Add'
import { Button } from '@mui/material'
import { Link } from 'react-router'
import { AppRoute } from '~app/routes'

interface Props {
  tripId?: string
}

/**
 * trip 컨텍스트에서 포스트 작성으로 진입.
 * 미래에 photo feed 기능을 제거할 경우 import한 곳에서 이 컴포넌트만 떼어내면 된다.
 */
export function CreatePostEntry({ tripId }: Props) {
  const to = tripId ? `${AppRoute.포스트_생성}?tripId=${tripId}` : AppRoute.포스트_생성
  return (
    <Button
      component={Link}
      to={to}
      startIcon={<AddIcon />}
      size="small"
      variant="outlined"
    >
      포스트 만들기
    </Button>
  )
}
