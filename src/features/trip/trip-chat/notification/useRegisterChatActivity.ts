import { useEffect } from 'react'
import { ChattingNotificationEvent } from './chatting-notification.types'
import type { ChattingNotificationMessage } from './chatting-notification.types'

function postToSW(message: ChattingNotificationMessage) {
  navigator.serviceWorker.controller?.postMessage(message)
}

export function useRegisterChatActivity(tripId: string) {
  useEffect(() => {
    postToSW({ type: ChattingNotificationEvent.open, tripId })
    return () => postToSW({ type: ChattingNotificationEvent.close, tripId })
  }, [tripId])
}
