import { beforeEach, describe, expect, it, vi } from 'vitest'
import { submitReport } from '../report.api'

vi.mock('../../../gateways/client', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../../gateways/auth', () => ({
  getSession: vi.fn(),
}))

import { getSession } from '../../../gateways/auth'
import { supabase } from '../../../gateways/client'

const mockFrom = vi.mocked(supabase.from)
const mockInsert = vi.fn()

beforeEach(() => {
  mockInsert.mockReset()
  mockFrom.mockReset()
  mockFrom.mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(getSession).mockReturnValue({ id: 'reporter-1' })
})

describe('submitReport', () => {
  it('신고자·대상·사유를 reports 테이블에 저장한다', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await submitReport({ targetType: 'post', targetId: 'post-1', reason: 'spam', detail: '광고성 글' })

    expect(mockFrom).toHaveBeenCalledWith('reports')
    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'reporter-1',
      target_type: 'post',
      target_id: 'post-1',
      reason: 'spam',
      detail: '광고성 글',
    })
  })

  it('상세 내용이 없으면 null로 저장한다', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await submitReport({ targetType: 'user', targetId: 'user-2', reason: 'harassment' })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ detail: null }))
  })

  it('이미 신고한 대상이면 성공으로 처리한다', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

    await expect(submitReport({ targetType: 'post', targetId: 'post-1', reason: 'spam' })).resolves.toBeUndefined()
  })

  it('그 밖의 에러는 그대로 던진다', async () => {
    const failure = { code: '42501', message: 'permission denied' }
    mockInsert.mockResolvedValue({ error: failure })

    await expect(submitReport({ targetType: 'post', targetId: 'post-1', reason: 'spam' })).rejects.toBe(failure)
  })

  it('로그인하지 않았으면 저장하지 않고 에러를 던진다', async () => {
    vi.mocked(getSession).mockReturnValue(null)

    await expect(submitReport({ targetType: 'post', targetId: 'post-1', reason: 'spam' })).rejects.toThrow()
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
