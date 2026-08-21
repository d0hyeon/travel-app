import { useEffect } from 'react'
import { useWebPushSubscription } from '~features/auth/useWebPushSubscription'
import type { ChatMessage } from '@waylog/domains/trip-chat'
import { subscribeAllTripMessages } from '@waylog/domains/trip-chat'

export function useChatWebPushFallback(onFallback: (message: ChatMessage) => void) {
  const { isEnabled, isSubscribed } = useWebPushSubscription()

  useEffect(() => {
    if (isEnabled || isSubscribed) return

    const unsubscribe = subscribeAllTripMessages((message) => {
      onFallback(message)
    })
    
    return () => unsubscribe();
  }, [isEnabled, isSubscribed])

}
