import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '~app/query-client'
import { createPost, deletePost, getPostById, postKey, type CreatePostInput } from './post.api'
import type { Post } from './post.types'
import { assert } from '@waylog/utility';


export const UsePostError = {
  Deleted: "DELETED_POST",
}

export function usePost(postId: string) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery({
    queryKey: usePost.key(postId),
    queryFn: () => getPostById(postId),
  })
  assert(!!data, UsePostError.Deleted);

  const { mutateAsync: remove } = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: usePost.key(postId) })
      queryClient.invalidateQueries({ queryKey: [postKey] })
    },
  })

  return { data, remove, ...queries }
}

usePost.key = (postId: string) => [postKey, postId]
usePost.prefetch = (postId: string) => {
  queryClient.prefetchQuery({
    queryKey: usePost.key(postId),
    queryFn: () => getPostById(postId),
  })
}

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
