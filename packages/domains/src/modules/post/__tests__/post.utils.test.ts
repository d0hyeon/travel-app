import { describe, it, expect } from 'vitest'
import { FEED_PAGE_SIZE, getNextFeedCursor } from '../post.utils'
import { PostVisibility, type Post } from '../post.types'

const makePost = (id: string, createdAt: string): Post => ({
  id,
  authorId: 'author-1',
  tripId: null,
  title: null,
  description: null,
  places: [],
  visibility: PostVisibility.PUBLIC,
  photos: [],
  likeCount: 0,
  likedByMe: false,
  createdAt,
  updatedAt: null,
})

const makePage = (size: number): Post[] =>
  Array.from({ length: size }, (_, index) => makePost(`post-${index}`, `2026-10-01T00:00:${String(59 - index).padStart(2, '0')}Z`))

describe('getNextFeedCursor', () => {
  it('페이지가 가득 찼으면 마지막 포스트를 다음 커서로 쓴다', () => {
    const page = makePage(FEED_PAGE_SIZE)
    const lastPost = page[page.length - 1]

    expect(getNextFeedCursor(page)).toEqual({ createdAt: lastPost.createdAt, id: lastPost.id })
  })

  it('페이지가 덜 찼으면 마지막 페이지이므로 커서가 없다', () => {
    expect(getNextFeedCursor(makePage(FEED_PAGE_SIZE - 1))).toBeUndefined()
  })

  it('빈 페이지면 커서가 없다', () => {
    expect(getNextFeedCursor([])).toBeUndefined()
  })
})
