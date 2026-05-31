import { useEffect } from 'react'
import { ChattingNotificationEvent } from './chatting-notification.types'
import type { ChattingNotificationMessage } from './chatting-notification.types'

export function useSubscribeChatNotification(onOpen: (tripId: string) => void) {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const { type, tripId } = (event.data ?? {}) as ChattingNotificationMessage
      if (type === ChattingNotificationEvent.openPanel && tripId) {
        onOpen(tripId)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [onOpen])
}
