import { describe, it, expect, beforeEach } from 'vitest'
import { getUnreadCount, markAsRead, getLastReadAt } from '../useUnreadChatCount'
import { setLastReadStore } from '../lastReadStore'
import type { ChatMessage } from '../tripChat.types'

const makeMessage = (id: string, createdAt: string): ChatMessage => ({
  id,
  tripId: 'trip-1',
  userId: 'user-1',
  userName: '테스트 유저',
  content: 'hello',
  createdAt,
})

// 기본 저장소는 메모리라 테스트마다 새로 꽂아 비운다.
beforeEach(() => {
  const store = new Map<string, string>()
  setLastReadStore({
    get: (key) => store.get(key) ?? null,
    set: (key, value) => void store.set(key, value),
  })
})

describe('getUnreadCount', () => {
  it('lastReadAt이 없으면 모든 메시지를 안읽음으로 카운트한다', () => {
    const messages = [
      makeMessage('1', '2026-05-31T10:00:00Z'),
      makeMessage('2', '2026-05-31T11:00:00Z'),
    ]
    expect(getUnreadCount('trip-1', messages)).toBe(2)
  })

  it('lastReadAt 이후 메시지만 안읽음으로 카운트한다', () => {
    markAsRead('trip-1')
    const before = new Date(Date.now() - 5000).toISOString()
    const after = new Date(Date.now() + 5000).toISOString()
    const messages = [
      makeMessage('1', before),
      makeMessage('2', after),
    ]
    expect(getUnreadCount('trip-1', messages)).toBe(1)
  })

  it('메시지가 없으면 0을 반환한다', () => {
    expect(getUnreadCount('trip-1', [])).toBe(0)
  })
})

describe('markAsRead', () => {
  it('현재 시각을 lastReadAt으로 저장한다', () => {
    const before = Date.now()
    markAsRead('trip-1')
    const after = Date.now()
    const saved = new Date(getLastReadAt('trip-1')!).getTime()
    expect(saved).toBeGreaterThanOrEqual(before)
    expect(saved).toBeLessThanOrEqual(after)
  })
})
