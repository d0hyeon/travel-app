import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import { IconButton, Stack, Typography, type StackProps } from '@mui/material'
import { useAuthNavigate } from '~features/auth/AuthNavigate'
import { usePostLikes, type Post } from '@waylog/domains/modules/post'

interface Props extends StackProps {
  post: Pick<Post, 'id' | 'likeCount' | 'likedByMe'>;
}

export function PostLikeButton({ post, ...props }: Props) {
  const { data, toggle, canLike } = usePostLikes(post)
  const navigateToLogin = useAuthNavigate()

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} {...props}>
      <IconButton
        size="small"
        onClick={() => {
          if (!canLike) return navigateToLogin()
          toggle().catch(() => undefined)
        }}
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
