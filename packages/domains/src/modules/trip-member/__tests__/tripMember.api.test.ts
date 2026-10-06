import { describe, expect, it } from 'vitest'
import { toTripMember } from '../tripMember.api'
import { LEFT_MEMBER_NAME } from '../tripMember.types'

const profile = { id: 'user-1', name: '민지', avatar_url: 'https://img/1.png' }
const source = {
  tripId: 'trip-1',
  tripCreatedAt: '2026-01-01T00:00:00Z',
  hostUserId: 'host-user',
  profile,
}

describe('toTripMember', () => {
  it('활성 멤버는 프로필 이름과 아바타를 그대로 가진다', () => {
    const member = toTripMember({
      ...source,
      membership: { id: 'm-1', created_at: '2026-02-01T00:00:00Z', left_at: null },
    })
    expect(member).toMatchObject({ name: '민지', profileUrl: 'https://img/1.png', hasLeft: false })
  })

  it('탈퇴한 멤버는 이름이 탈퇴한 유저로 바뀌고 아바타가 없다', () => {
    const member = toTripMember({
      ...source,
      membership: { id: 'm-1', created_at: '2026-02-01T00:00:00Z', left_at: '2026-03-01T00:00:00Z' },
    })
    expect(member).toMatchObject({ name: LEFT_MEMBER_NAME, profileUrl: null, hasLeft: true })
  })

  it('가입 시각은 멤버 행의 생성 시각이다', () => {
    const member = toTripMember({
      ...source,
      membership: { id: 'm-1', created_at: '2026-02-01T00:00:00Z', left_at: null },
    })
    expect(member.joinedAt).toBe('2026-02-01T00:00:00Z')
  })

  it('멤버 행이 없는 호스트의 가입 시각은 여행 생성 시각이다', () => {
    const member = toTripMember({
      ...source,
      hostUserId: 'user-1',
      membership: undefined,
    })
    expect(member).toMatchObject({ isHost: true, hasLeft: false, joinedAt: '2026-01-01T00:00:00Z' })
  })

  it('프로필이 여행의 호스트이면 isHost 이다', () => {
    const member = toTripMember({
      ...source,
      hostUserId: 'user-1',
      membership: { id: 'm-1', created_at: '2026-02-01T00:00:00Z', left_at: null },
    })
    expect(member.isHost).toBe(true)
  })
})
