import { useFeed, type Post } from '@waylog/domains/modules/post'
import { assert } from '~shared/utils/assert'

export function useFeedPost(postId: string): Post {
  const { data: posts } = useFeed()
  const post = posts.find((candidate) => candidate.id === postId)

  assert(post != null, '포스트를 찾을 수 없습니다.')
  return post
}
