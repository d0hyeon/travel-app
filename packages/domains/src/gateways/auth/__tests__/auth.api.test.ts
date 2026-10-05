import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelSignUp, deleteAccount } from '../auth.api'

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

describe('deleteAccount', () => {
  const mockRequestAppleAuthorizationCode = vi.fn()

  beforeEach(() => {
    mockRequestAppleAuthorizationCode.mockReset()
    vi.mocked(getAuthService).mockReturnValue({
      signOut: mockSignOut,
      requestAppleAuthorizationCode: mockRequestAppleAuthorizationCode,
    } as never)
  })

  it('Apple 인가 코드와 함께 탈퇴 함수를 호출한 뒤 로그아웃한다', async () => {
    mockRequestAppleAuthorizationCode.mockResolvedValue('apple-code')
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null })

    await deleteAccount()

    expect(mockInvoke).toHaveBeenCalledWith('delete-account', { body: { appleAuthorizationCode: 'apple-code' } })
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('Apple 로그인이 아니면 인가 코드 없이 호출한다', async () => {
    mockRequestAppleAuthorizationCode.mockResolvedValue(undefined)
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null })

    await deleteAccount()

    expect(mockInvoke).toHaveBeenCalledWith('delete-account', { body: { appleAuthorizationCode: undefined } })
  })

  it('Apple 재인증이 실패하면 함수를 호출하지 않고 에러를 던진다', async () => {
    const canceled = new Error('canceled')
    mockRequestAppleAuthorizationCode.mockRejectedValue(canceled)

    await expect(deleteAccount()).rejects.toBe(canceled)
    expect(mockInvoke).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('함수가 실패하면 로그아웃하지 않고 에러를 던진다', async () => {
    const failure = new Error('function failed')
    mockRequestAppleAuthorizationCode.mockResolvedValue(undefined)
    mockInvoke.mockResolvedValue({ data: null, error: failure })

    await expect(deleteAccount()).rejects.toBe(failure)
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
