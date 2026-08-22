import { describe, it, expect } from 'vitest'
import type { ChatMessage } from '../tripChat.types'

describe('ChatMessage 타입', () => {
  it('필수 필드를 모두 포함한다', () => {
    const msg: ChatMessage = {
      id: 'msg-1',
      tripId: 'trip-1',
      userId: 'user-1',
      userName: '테스트 유저',
      content: '안녕',
      createdAt: '2026-05-31T00:00:00Z',
    }
    expect(msg.id).toBe('msg-1')
    expect(msg.tripId).toBe('trip-1')
    expect(msg.userId).toBe('user-1')
    expect(msg.content).toBe('안녕')
    expect(msg.createdAt).toBe('2026-05-31T00:00:00Z')
  })
})
