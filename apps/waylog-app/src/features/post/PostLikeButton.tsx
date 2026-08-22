import { MaterialIcons } from '@expo/vector-icons'
import { usePostLikes } from '@waylog/domains/modules/post'
import { Pressable } from 'react-native'
import { Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'

export function PostLikeButton({ postId }: { postId: string }) {
  const { data, toggle, canLike } = usePostLikes(postId)

  return (
    <Stack direction="row" alignItems="center" sx={{ gap: 4 }}>
      <Pressable
        onPress={(event) => {
          event.stopPropagation()
          toggle().catch(() => undefined)
        }}
        disabled={!canLike}
        accessibilityLabel={data.liked ? '좋아요 취소' : '좋아요'}
        hitSlop={8}
      >
        <MaterialIcons name={data.liked ? 'favorite' : 'favorite-border'} size={22} color={data.liked ? '#D32F2F' : palette.textSecondary} />
      </Pressable>
      <Typography sx={{ fontSize: 11, color: palette.textSecondary }}>{data.count}</Typography>
    </Stack>
  )
}
