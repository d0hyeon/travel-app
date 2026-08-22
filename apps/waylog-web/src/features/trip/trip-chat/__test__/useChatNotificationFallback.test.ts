import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useChatWebPushFallback } from '../notification/useChatWebPushFallback'
import type { ChatMessage } from '@waylog/domains/modules/trip-chat'

const makeMessage = (id: string, tripId = 'trip-1', content = '새 메시지'): ChatMessage => ({
  id,
  tripId,
  userId: 'user-1',
  userName: '테스트 유저',
  content,
  createdAt: '2026-06-04T00:00:00.000Z',
})

vi.mock('~features/auth/useWebPushSubscription', () => ({
  useWebPushSubscription: vi.fn(),
}))

vi.mock('@waylog/domains/modules/trip-chat', () => ({
  subscribeAllTripMessages: vi.fn(),
}))

import { useWebPushSubscription } from '~features/auth/useWebPushSubscription'
import { subscribeAllTripMessages } from '@waylog/domains/modules/trip-chat'

const mockUseWebPushSubscription = vi.mocked(useWebPushSubscription)
const mockSubscribeAllTripMessages = vi.mocked(subscribeAllTripMessages)

beforeEach(() => {
  vi.clearAllMocks()
  mockSubscribeAllTripMessages.mockReturnValue(() => {})
  mockUseWebPushSubscription.mockReturnValue({
    isEnabled: false,
    isSubscribed: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    hasPermission: false,
    requestPermission: vi.fn(),
  })
})

describe('useChatWebPushFallback', () => {
  describe('웹 푸시 불가 환경', () => {
    it('마운트 시 전체 채팅을 구독한다', () => {
      renderHook(() => useChatWebPushFallback(vi.fn()))
      expect(mockSubscribeAllTripMessages).toHaveBeenCalledOnce()
    })

    it('언마운트 시 구독을 해제한다', () => {
      const unsubscribe = vi.fn()
      mockSubscribeAllTripMessages.mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() => useChatWebPushFallback(vi.fn()))
      unmount()

      expect(unsubscribe).toHaveBeenCalledOnce()
    })

    it('메시지 수신 시 onFallback을 호출한다', () => {
      const onFallback = vi.fn()
      let capturedCallback: ((message: ChatMessage) => void) | undefined
      mockSubscribeAllTripMessages.mockImplementation((cb: (message: ChatMessage) => void) => {
        capturedCallback = cb
        return () => {}
      })

      renderHook(() => useChatWebPushFallback(onFallback))

      capturedCallback!(makeMessage('1', 'trip-1', '안녕하세요'))
      expect(onFallback).toHaveBeenCalledWith(makeMessage('1', 'trip-1', '안녕하세요'))
    })
  })

  describe('웹 푸시 가능 환경', () => {
    beforeEach(() => {
      mockUseWebPushSubscription.mockReturnValue({
        isEnabled: true,
        isSubscribed: true,
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hasPermission: true,
        requestPermission: vi.fn(),
      })
    })

    it('마운트 시 구독하지 않는다', () => {
      renderHook(() => useChatWebPushFallback(vi.fn()))
      expect(mockSubscribeAllTripMessages).not.toHaveBeenCalled()
    })
  })
})
