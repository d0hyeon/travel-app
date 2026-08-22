import { useEffect } from 'react'

/**
 * 지금 열려 있는 채팅방을 기억한다.
 *
 * 푸시 알림이 도착했을 때 "이미 그 방을 보고 있으면 띄우지 않는" 판단에 쓴다.
 * 플랫폼마다 알림 경로는 다르지만 이 판단은 같다.
 */
let activeTripId: string | null = null

export function getActivedChatTripId(): string | null {
  return activeTripId
}

interface Options {
  /** 열림·닫힘을 플랫폼에 알린다. 웹은 service worker 로 보낸다. */
  onChange?: (state: { tripId: string; isOpen: boolean }) => void
}

export function useChatActivation(tripId: string, { onChange }: Options = {}) {
  useEffect(() => {
    activeTripId = tripId
    onChange?.({ tripId, isOpen: true })

    return () => {
      activeTripId = null
      onChange?.({ tripId, isOpen: false })
    }
  }, [tripId])
}
