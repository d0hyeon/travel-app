import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import { IconButton } from '@mui/material'
import { useAuth } from '@waylog/domains/clients'
import { usePlaceBookmark } from '@waylog/domains/modules/place-bookmark'
import { Suspense } from 'react'
import { toast } from 'sonner'
import { useAuthNavigate } from '~features/auth/AuthNavigate'

interface Props {
  placeId: string
}

export function PlaceBookmarkButton({ placeId }: Props) {
  return (
    <Suspense fallback={<IconButton disabled><BookmarkBorderIcon /></IconButton>}>
      <Resolved placeId={placeId} />
    </Suspense>
  )
}

function Resolved({ placeId }: Props) {
  const { data: auth } = useAuth({ required: false })
  const { isBookmarked, toggle } = usePlaceBookmark(placeId)
  const navigateToLogin = useAuthNavigate()

  const handleClick = async () => {
    if (auth == null) return navigateToLogin()

    await toggle()
    toast.success(isBookmarked ? '저장을 해제했어요' : '장소를 저장했어요')
  }

  return (
    <IconButton
      aria-label={isBookmarked ? '장소 저장 해제' : '장소 저장'}
      color="primary"
      onClick={handleClick}
    >
      {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
    </IconButton>
  )
}
