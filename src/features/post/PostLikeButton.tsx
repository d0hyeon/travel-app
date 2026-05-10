import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import { IconButton, Stack, Typography, type StackProps } from '@mui/material'
import { usePostLikes } from './usePostLikes'

interface Props extends StackProps {
  postId: string;
}

export function PostLikeButton({ postId, ...props }: Props) {
  const { data, toggle, canLike } = usePostLikes(postId)

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} {...props}>
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
