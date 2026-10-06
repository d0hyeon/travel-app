import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatActivation, getActivedChatTripId } from '../useChatActivation'

Object.defineProperty(navigator, 'serviceWorker', {
  value: { controller: { postMessage: vi.fn() } },
  writable: true,
})

afterEach(() => {
  const { unmount } = renderHook(() => useChatActivation('__cleanup__'))
  act(() => unmount())
})

describe('chat activation store', () => {
  it('useChatActivation 마운트 시 getActivedChatTripId가 tripId를 반환한다', async () => {
    const { unmount } = renderHook(() => useChatActivation('trip-1'))
    await act(async () => {})
    expect(getActivedChatTripId()).toBe('trip-1')
    unmount()
  })

  it('useChatActivation 언마운트 시 getActivedChatTripId가 null을 반환한다', async () => {
    const { unmount } = renderHook(() => useChatActivation('trip-1'))
    await act(async () => {})
    act(() => unmount())
    expect(getActivedChatTripId()).toBeNull()
  })
})
