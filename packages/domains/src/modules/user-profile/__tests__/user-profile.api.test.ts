import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signUp } from '../user-profile.api'
import { TERMS_VERSION } from '../../terms'

vi.mock('../../../gateways/client', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../../gateways/client'

const mockFrom = vi.mocked(supabase.from)
const mockInsert = vi.fn()

beforeEach(() => {
  mockInsert.mockReset()
  mockFrom.mockReset()
  mockFrom.mockReturnValue({ insert: mockInsert } as never)
})

describe('signUp', () => {
  it('프로필을 현재 약관 버전과 동의 시각과 함께 저장한다', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await signUp({ id: 'user-1', name: '민수', avatar: 'https://img/a.png' })

    expect(mockFrom).toHaveBeenCalledWith('user_profiles')
    expect(mockInsert).toHaveBeenCalledWith({
      id: 'user-1',
      name: '민수',
      avatar_url: 'https://img/a.png',
      terms_version: TERMS_VERSION,
      terms_agreed_at: expect.any(String),
    })
  })

  it('이름이 없으면 빈 문자열로 저장한다', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await signUp({ id: 'user-1' })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ name: '' }))
  })

  it('이미 프로필이 있으면 충돌 에러를 그대로 던진다', async () => {
    const conflict = { code: '23505', message: 'duplicate key' }
    mockInsert.mockResolvedValue({ error: conflict })

    await expect(signUp({ id: 'user-1' })).rejects.toBe(conflict)
  })
})
