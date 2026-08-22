import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getAuth } from '@waylog/domains/clients'
import { addLike, getLikeStatus, postLikeKey, removeLike } from './post.api'

interface LikeStatus {
  count: number
  liked: boolean
}

export function usePostLikes(postId: string) {
  const queryClient = useQueryClient()
  const auth = getAuth()
  const userId = auth?.id

  const { data } = useSuspenseQuery<LikeStatus>({
    queryKey: usePostLikes.key(postId),
    queryFn: () => (userId ? getLikeStatus(postId, userId) : Promise.resolve({ count: 0, liked: false })),
  })

  const { mutateAsync: toggle, isPending } = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('로그인이 필요해요')
      if (data.liked) {
        await removeLike(postId, userId)
      } else {
        await addLike(postId, userId)
      }
    },
    onMutate: () => {
      queryClient.setQueryData<LikeStatus>(usePostLikes.key(postId), (curr) => {
        if (!curr) return curr
        return curr.liked
          ? { count: Math.max(0, curr.count - 1), liked: false }
          : { count: curr.count + 1, liked: true }
      })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: usePostLikes.key(postId) })
    },
  })

  return { data, toggle, isPending, canLike: userId != null }
}

usePostLikes.key = (postId: string) => [postLikeKey, postId]
