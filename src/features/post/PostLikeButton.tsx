import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import { IconButton, Stack, Typography } from '@mui/material'
import { usePostLikes } from './usePostLikes'

interface Props {
  postId: string
}

export function PostLikeButton({ postId }: Props) {
  const { data, toggle, canLike } = usePostLikes(postId)

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <IconButton
        size="small"
        disabled={!canLike}
        onClick={() => toggle().catch(() => undefined)}
      >
        {data.liked ? (
          <FavoriteIcon fontSize="small" color="error" />
        ) : (
          <FavoriteBorderIcon fontSize="small" />
        )}
      </IconButton>
      <Typography variant="caption">{data.count}</Typography>
    </Stack>
  )
}
