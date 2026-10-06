import { describe, expect, it } from 'vitest'
import { findHostSuccessor } from '../tripMember.utils'
import type { TripMember } from '../tripMember.types'

const member = (overrides: Partial<TripMember>): TripMember => ({
  tripId: 'trip-1',
  id: 'm',
  userId: 'u',
  name: '멤버',
  profileUrl: null,
  isHost: false,
  hasLeft: false,
  joinedAt: '2026-02-01T00:00:00Z',
  ...overrides,
})

describe('findHostSuccessor', () => {
  it('호스트를 제외하고 가장 먼저 합류한 멤버가 승계자다', () => {
    const members = [
      member({ id: 'host', isHost: true, joinedAt: '2026-01-01T00:00:00Z' }),
      member({ id: 'late', joinedAt: '2026-03-01T00:00:00Z' }),
      member({ id: 'early', joinedAt: '2026-02-01T00:00:00Z' }),
    ]
    expect(findHostSuccessor(members)?.id).toBe('early')
  })

  it('이미 탈퇴한 멤버는 승계자가 될 수 없다', () => {
    const members = [
      member({ id: 'host', isHost: true }),
      member({ id: 'left', hasLeft: true, joinedAt: '2026-01-15T00:00:00Z' }),
      member({ id: 'active', joinedAt: '2026-03-01T00:00:00Z' }),
    ]
    expect(findHostSuccessor(members)?.id).toBe('active')
  })

  it('합류 시각이 같으면 id 가 작은 멤버가 목록 순서와 관계없이 승계자다', () => {
    const host = member({ id: 'host', isHost: true })
    const small = member({ id: 'a-small', joinedAt: '2026-02-01T00:00:00Z' })
    const large = member({ id: 'b-large', joinedAt: '2026-02-01T00:00:00Z' })
    expect(findHostSuccessor([host, small, large])?.id).toBe('a-small')
    expect(findHostSuccessor([host, large, small])?.id).toBe('a-small')
  })

  it('호스트 외 활성 멤버가 없으면 승계자가 없다', () => {
    const members = [member({ id: 'host', isHost: true }), member({ id: 'left', hasLeft: true })]
    expect(findHostSuccessor(members)).toBeUndefined()
  })

  it('목록 순서와 관계없이 가장 이른 합류 시각의 멤버를 고른다', () => {
    const members = [
      member({ id: 'c', joinedAt: '2026-04-01T00:00:00Z' }),
      member({ id: 'a', joinedAt: '2026-02-01T00:00:00Z' }),
      member({ id: 'b', joinedAt: '2026-03-01T00:00:00Z' }),
    ]
    expect(findHostSuccessor(members)?.id).toBe('a')
  })

  it('멤버가 하나도 없으면 승계자가 없다', () => {
    expect(findHostSuccessor([])).toBeUndefined()
  })

  it('시각 문자열 형식이 달라도 시각 기준으로 비교한다', () => {
    const members = [
      member({ id: 'later', joinedAt: '2026-02-01T00:30:00+00:00' }),
      member({ id: 'earlier', joinedAt: '2026-02-01T09:00:00+09:00' }),
    ]
    expect(findHostSuccessor(members)?.id).toBe('earlier')
  })
})
