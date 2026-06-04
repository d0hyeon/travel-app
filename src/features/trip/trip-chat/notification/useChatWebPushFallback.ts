import { useEffect } from 'react'
import { useWebPushSubscription } from '~features/auth/useWebPushSubscription'
import type { ChatMessage } from '../tripChat.types'
import { subscribeAllTripMessages } from '../tripChat.api'

export function useChatWebPushFallback(onFallback: (message: ChatMessage) => void) {
  const { isEnabled } = useWebPushSubscription()

  useEffect(() => {
    if (isEnabled) return

    const unsubscribe = subscribeAllTripMessages((message) => {
      onFallback(message)
    })
    
    return () => unsubscribe();
  }, [isEnabled])

}
