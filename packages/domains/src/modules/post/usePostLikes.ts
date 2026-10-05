import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '../../gateways/auth'
import { addLike, getLikeStatus, postLikeKey, removeLike } from './post.api'

export function usePostLikes(postId: string) {
  const { data: auth } = useAuth({ required: false })
  const queryClient = useQueryClient()
  const queryKey = usePostLikes.key(postId, auth?.id)
  const { data } = useSuspenseQuery({
    queryKey,
    queryFn: () => getLikeStatus(postId),
  })
  const { mutateAsync: toggle } = useMutation({
    mutationFn: async () => {
      if (!auth) return
      if (data.liked) {
        await removeLike(postId, auth.id)
        return
      }
      await addLike(postId, auth.id)
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (current: typeof data | undefined) => current == null
        ? current
        : { count: current.liked ? current.count - 1 : current.count + 1, liked: !current.liked })
    },
  })

  return { data, toggle, canLike: auth != null }
}

usePostLikes.key = (postId: string, userId?: string) => [postLikeKey, postId, userId ?? 'anonymous']
