import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blockUser, getBlockedUsers, unblockUser } from '../userBlock.api'

vi.mock('../../../gateways/client', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../../gateways/auth', () => ({
  getSession: vi.fn(),
}))
vi.mock('../../user-profile/user-profile.api', () => ({
  getUserProfilesByIds: vi.fn(),
}))

import { getSession } from '../../../gateways/auth'
import { supabase } from '../../../gateways/client'
import { getUserProfilesByIds } from '../../user-profile/user-profile.api'

const mockFrom = vi.mocked(supabase.from)

beforeEach(() => {
  mockFrom.mockReset()
  vi.mocked(getUserProfilesByIds).mockReset()
  vi.mocked(getSession).mockReturnValue({ id: 'me' })
})

describe('blockUser', () => {
  it('차단자와 차단 대상을 user_blocks 에 저장한다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert } as never)

    await blockUser('user-2')

    expect(mockFrom).toHaveBeenCalledWith('user_blocks')
    expect(insert).toHaveBeenCalledWith({ blocker_id: 'me', blocked_id: 'user-2' })
  })

  it('이미 차단한 사용자면 성공으로 처리한다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })
    mockFrom.mockReturnValue({ insert } as never)

    await expect(blockUser('user-2')).resolves.toBeUndefined()
  })

  it('그 밖의 에러는 그대로 던진다', async () => {
    const failure = { code: '42501', message: 'permission denied' }
    mockFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: failure }) } as never)

    await expect(blockUser('user-2')).rejects.toBe(failure)
  })
})

describe('unblockUser', () => {
  it('내가 차단한 해당 사용자의 차단만 지운다', async () => {
    const eqBlocked = vi.fn().mockResolvedValue({ error: null })
    const eqBlocker = vi.fn().mockReturnValue({ eq: eqBlocked })
    mockFrom.mockReturnValue({ delete: () => ({ eq: eqBlocker }) } as never)

    await unblockUser('user-2')

    expect(eqBlocker).toHaveBeenCalledWith('blocker_id', 'me')
    expect(eqBlocked).toHaveBeenCalledWith('blocked_id', 'user-2')
  })
})

describe('getBlockedUsers', () => {
  it('차단한 사용자의 프로필을 차단한 순서대로 돌려준다', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ blocked_id: 'b' }, { blocked_id: 'a' }],
      error: null,
    })
    mockFrom.mockReturnValue({ select: () => ({ order }) } as never)
    vi.mocked(getUserProfilesByIds).mockResolvedValue([
      { id: 'a', name: 'A', profileUrl: null },
      { id: 'b', name: 'B', profileUrl: null },
    ])

    const users = await getBlockedUsers()

    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(users.map((user) => user.id)).toEqual(['b', 'a'])
  })

  it('차단한 사용자가 없으면 프로필을 조회하지 않는다', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue({ select: () => ({ order }) } as never)

    expect(await getBlockedUsers()).toEqual([])
    expect(getUserProfilesByIds).not.toHaveBeenCalled()
  })
})
