import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelSignUp } from '../auth.api'

vi.mock('../../client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}))
vi.mock('../auth.service', () => ({
  getAuthService: vi.fn(),
}))

import { supabase } from '../../client'
import { getAuthService } from '../auth.service'

const mockInvoke = vi.mocked(supabase.functions.invoke)
const mockSignOut = vi.fn()

beforeEach(() => {
  mockInvoke.mockReset()
  mockSignOut.mockReset()
  vi.mocked(getAuthService).mockReturnValue({ signOut: mockSignOut } as never)
})

describe('cancelSignUp', () => {
  it('가입 취소 함수를 호출한 뒤 로그아웃한다', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null })

    await cancelSignUp()

    expect(mockInvoke).toHaveBeenCalledWith('cancel-sign-up')
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('함수가 실패하면 로그아웃하지 않고 에러를 던진다', async () => {
    const failure = new Error('function failed')
    mockInvoke.mockResolvedValue({ data: null, error: failure })

    await expect(cancelSignUp()).rejects.toBe(failure)
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
