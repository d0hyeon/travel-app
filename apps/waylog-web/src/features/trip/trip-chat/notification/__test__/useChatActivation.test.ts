import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatActivation, getActivedChatTripId } from '../useChatActivation'

Object.defineProperty(navigator, 'serviceWorker', {
  value: { controller: { postMessage: vi.fn() } },
  writable: true,
})

describe('useChatActivation', () => {
  it('마운트 시 tripId를 등록한다', async () => {
    const { unmount } = renderHook(() => useChatActivation('trip-1'))
    await act(async () => {})
    expect(getActivedChatTripId()).toBe('trip-1')
    unmount()
  })

  it('언마운트 시 등록을 해제한다', async () => {
    const { unmount } = renderHook(() => useChatActivation('trip-1'))
    await act(async () => {})
    act(() => unmount())
    expect(getActivedChatTripId()).toBeNull()
  })
})
