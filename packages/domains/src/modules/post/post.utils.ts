import type { Post, PostCursor } from './post.types'

export const FEED_PAGE_SIZE = 20

export function getNextFeedCursor(page: Post[]): PostCursor | undefined {
  if (page.length < FEED_PAGE_SIZE) return undefined
  const lastPost = page[page.length - 1]
  return { createdAt: lastPost.createdAt, id: lastPost.id }
}
