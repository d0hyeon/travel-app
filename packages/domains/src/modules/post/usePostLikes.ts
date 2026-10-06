import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '../../gateways/auth'
import { addLike, getPostById, postLikeKey, removeLike } from './post.api'
import type { Post, PostLikeStatus } from './post.types'

export function usePostLikes(post: Pick<Post, 'id' | 'likeCount' | 'likedByMe'>) {
  const { data: auth } = useAuth({ required: false })
  const queryClient = useQueryClient()
  const queryKey = usePostLikes.key(post.id, auth?.id)
  const { data } = useSuspenseQuery<PostLikeStatus>({
    queryKey,
    queryFn: async () => {
      const latest = await getPostById(post.id)
      return { count: latest?.likeCount ?? 0, liked: latest?.likedByMe ?? false }
    },
    initialData: { count: post.likeCount, liked: post.likedByMe },
    staleTime: Infinity,
  })
  const { mutateAsync: toggle } = useMutation({
    mutationFn: async () => {
      if (!auth) return
      if (data.liked) {
        await removeLike(post.id, auth.id)
        return
      }
      await addLike(post.id, auth.id)
    },
    onMutate: () => {
      queryClient.setQueryData(queryKey, (current: PostLikeStatus | undefined) => current == null
        ? current
        : { count: current.liked ? current.count - 1 : current.count + 1, liked: !current.liked })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { data, toggle, canLike: auth != null }
}

usePostLikes.key = (postId: string, userId?: string) => [postLikeKey, postId, userId ?? 'anonymous']
