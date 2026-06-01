import { useEffect } from 'react'
import { ChattingNotificationType, type ChattingNotificationMessage } from './chatting-notification.types'

function postToSW(message: ChattingNotificationMessage) {
  navigator.serviceWorker.controller?.postMessage(message)
}

export function useChatActivation(tripId: string) {
  useEffect(() => {
    postToSW({ type: ChattingNotificationType.open, tripId })
    return () => postToSW({ type: ChattingNotificationType.close, tripId })
  }, [tripId])
}
