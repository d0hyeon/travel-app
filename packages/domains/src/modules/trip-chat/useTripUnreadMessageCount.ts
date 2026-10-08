import { useEffect } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getAuth } from '../../gateways/auth'
import { useTrips } from '../trip/useTrips'
import { getTripUnreadCounts, subscribeTripMessageActivity, tripChatKey } from './tripChat.api'
import { buildLastReads, increaseUnreadCount } from './tripUnreadCounts.utils'
import { getStorage, hydrateStorage } from '../storage'
import type { ChatMessage } from './tripChat.types'

let subscriberCount = 0
let unsubscribeAll: (() => void) | null = null

export function useTripUnreadMessageCount(tripId: string): number {
  const queryClient = useQueryClient()
  const { data: trips } = useTrips()
  const tripIds = trips.map((trip) => trip.id)

  const { data: unreadCount } = useSuspenseQuery({
    queryKey: useTripUnreadMessageCount.key(tripIds),
    queryFn: () => getTripUnreadCounts(buildLastReads(tripIds)),
    staleTime: 0,
    refetchOnWindowFocus: true,
    select: (unreadCounts) => unreadCounts[tripId] ?? 0,
  })

  useEffect(() => {
    subscriberCount += 1
    if (subscriberCount === 1) {
      const unsubscribeMessages = subscribeTripMessageActivity((message) => {
        if (message.userId === getAuth()?.id) return
        queryClient.setQueriesData<Record<string, number>>(
          { queryKey: useTripUnreadMessageCount.rootKey() },
          (unreadCounts) => unreadCounts && increaseUnreadCount(unreadCounts, message.tripId),
        )
      })
      const unsubscribeLastRead = subscribeLastReadChange(() => {
        void queryClient.invalidateQueries({ queryKey: useTripUnreadMessageCount.rootKey() })
      })
      unsubscribeAll = () => {
        unsubscribeMessages()
        unsubscribeLastRead()
      }
    }

    return () => {
      subscriberCount -= 1
      if (subscriberCount > 0) return
      unsubscribeAll?.()
      unsubscribeAll = null
    }
  }, [queryClient])

  return unreadCount
}
useTripUnreadMessageCount.rootKey = () => [tripChatKey, 'unread-counts']
useTripUnreadMessageCount.key = (tripIds: string[]) => [...useTripUnreadMessageCount.rootKey(), tripIds]



const STORAGE_KEY_PREFIX = 'chat_last_read_'
const STORAGE_KEY = (tripId: string) => `${STORAGE_KEY_PREFIX}${tripId}`

// 웹은 EventTarget 을 썼지만 RN 에 없다. 구독을 직접 들고 있는다.
const listeners = new Set<(tripId: string, lastReadAt: string) => void>()

export function hydrateLastReadAt(): Promise<void> {
  return hydrateStorage(STORAGE_KEY_PREFIX)
}

export function getLastReadAt(tripId: string): string | null {
  return getStorage().get(STORAGE_KEY(tripId))
}

export function markAsRead(tripId: string, lastMessageAt?: string): void {
  const lastReadAt = lastMessageAt ?? new Date().toISOString()
  getStorage().set(STORAGE_KEY(tripId), lastReadAt)
  listeners.forEach((notify) => notify(tripId, lastReadAt))
}

export function subscribeLastReadChange(notify: () => void): () => void {
  listeners.add(notify)
  return () => void listeners.delete(notify)
}

export function getUnreadCount(tripId: string, messages: ChatMessage[]): number {
  return countAfter(getLastReadAt(tripId), messages)
}


/** 읽은 시각이 없으면 전부 안읽음이다. */
function countAfter(lastReadAt: string | null, messages: ChatMessage[]): number {
  if (!lastReadAt) return messages.length
  return messages.filter((message) => message.createdAt > lastReadAt).length
}