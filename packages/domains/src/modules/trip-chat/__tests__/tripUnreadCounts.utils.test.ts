import { describe, it, expect, beforeEach } from 'vitest'
import { buildLastReads, increaseUnreadCount } from '../tripUnreadCounts.utils'
import { configureStorage } from '../../storage'
import { markAsRead } from '../useTripUnreadMessageCount'

beforeEach(() => {
  const store = new Map<string, string>()
  configureStorage({
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
  })
})

describe('buildLastReads', () => {
  it('읽은 시각이 있는 여행만 담아 읽은 적 없는 여행은 서버가 전부 안읽음으로 세게 한다', () => {
    markAsRead('trip-1', '2026-05-31T10:00:00Z')

    expect(buildLastReads(['trip-1', 'trip-2'])).toEqual({ 'trip-1': '2026-05-31T10:00:00Z' })
  })

  it('여행마다 저장된 읽은 시각을 그대로 담는다', () => {
    markAsRead('trip-1', '2026-05-31T10:00:00Z')
    markAsRead('trip-2', '2026-06-01T09:00:00Z')

    expect(buildLastReads(['trip-1', 'trip-2'])).toEqual({
      'trip-1': '2026-05-31T10:00:00Z',
      'trip-2': '2026-06-01T09:00:00Z',
    })
  })

  it('요청하지 않은 여행의 읽은 시각은 담지 않는다', () => {
    markAsRead('trip-1', '2026-05-31T10:00:00Z')
    markAsRead('trip-2', '2026-06-01T09:00:00Z')

    expect(buildLastReads(['trip-2'])).toEqual({ 'trip-2': '2026-06-01T09:00:00Z' })
  })

  it('해석할 수 없는 읽은 시각은 담지 않아 서버 변환 실패가 모든 뱃지로 번지지 않게 한다', () => {
    markAsRead('trip-1', '')
    markAsRead('trip-2', 'not-a-date')
    markAsRead('trip-3', '2026-06-01T09:00:00Z')

    expect(buildLastReads(['trip-1', 'trip-2', 'trip-3'])).toEqual({ 'trip-3': '2026-06-01T09:00:00Z' })
  })
})

describe('increaseUnreadCount', () => {
  it('해당 여행의 안읽음만 1 늘린다', () => {
    expect(increaseUnreadCount({ 'trip-1': 2, 'trip-2': 0 }, 'trip-1')).toEqual({ 'trip-1': 3, 'trip-2': 0 })
  })

  it('목록에 없는 여행의 메시지는 무시해 같은 객체를 돌려준다', () => {
    const unreadCounts = { 'trip-1': 2 }

    expect(increaseUnreadCount(unreadCounts, 'trip-9')).toBe(unreadCounts)
  })
})
