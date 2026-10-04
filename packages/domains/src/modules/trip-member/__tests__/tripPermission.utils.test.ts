import { describe, expect, it } from 'vitest'
import type { TripMember } from '../tripMember.types'
import { TripPermission } from '../tripPermission.types'
import { getTripRole, hasTripPermission } from '../tripPermission.utils'

const createMember = (userId: string, isHost: boolean): TripMember => ({
  id: `member-${userId}`,
  tripId: 'trip-1',
  userId,
  name: userId,
  profileUrl: null,
  isHost,
})

describe('getTripRole', () => {
  const members = [createMember('host-user', true), createMember('guest-user', false)]

  it('호스트인 멤버는 host 역할이다', () => {
    expect(getTripRole(members, 'host-user')).toBe('host')
  })

  it('호스트가 아닌 멤버는 member 역할이다', () => {
    expect(getTripRole(members, 'guest-user')).toBe('member')
  })

  it('멤버가 아닌 사용자는 역할이 없다', () => {
    expect(getTripRole(members, 'stranger')).toBeUndefined()
  })
})

describe('hasTripPermission', () => {
  it('호스트는 여행을 삭제할 수 있다', () => {
    expect(hasTripPermission('host', TripPermission.삭제)).toBe(true)
  })

  it('호스트는 멤버를 초대할 수 있다', () => {
    expect(hasTripPermission('host', TripPermission.초대)).toBe(true)
  })

  it('호스트는 여행을 나갈 수 없다', () => {
    expect(hasTripPermission('host', TripPermission.탈퇴)).toBe(false)
  })

  it('멤버는 여행을 나갈 수 있다', () => {
    expect(hasTripPermission('member', TripPermission.탈퇴)).toBe(true)
  })

  it('멤버는 여행을 삭제할 수 없다', () => {
    expect(hasTripPermission('member', TripPermission.삭제)).toBe(false)
  })

  it('멤버는 멤버를 초대할 수 없다', () => {
    expect(hasTripPermission('member', TripPermission.초대)).toBe(false)
  })
})
