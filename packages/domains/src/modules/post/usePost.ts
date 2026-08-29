import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { assert } from '@waylog/utility'
import { createPost, deletePost, getPostById, postKey, type CreatePostInput } from './post.api'
import type { Post } from './post.types'

export function usePost(postId: string) {
  const queryClient = useQueryClient()

  const { data, ...query } = useSuspenseQuery({
    queryKey: usePost.key(postId),
    queryFn: () => getPostById(postId),
  })
  assert(data != null, 'DELETED_POST')

  const { mutateAsync: remove } = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: usePost.key(postId) })
      queryClient.invalidateQueries({ queryKey: [postKey] })
    },
  })

  return { data, remove, ...query }
}

usePost.key = (postId: string) => [postKey, postId]

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: (post: Post) => {
      queryClient.setQueryData(usePost.key(post.id), post)
      queryClient.invalidateQueries({ queryKey: [postKey] })
    },
  })
}
