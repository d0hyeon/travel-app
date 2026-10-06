import { useEffect } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getAuth } from '../../gateways/auth'
import { useTrips } from '../trip/useTrips'
import { getTripUnreadCounts, subscribeTripMessageActivity, tripChatKey } from './tripChat.api'
import { buildLastReads, increaseUnreadCount } from './tripUnreadCounts.utils'
import { subscribeLastReadChange } from './useUnreadChatCount'

let subscriberCount = 0
let unsubscribeAll: (() => void) | null = null

export function useTripUnreadCount(tripId: string): number {
  const queryClient = useQueryClient()
  const { data: trips } = useTrips()
  const tripIds = trips.map((trip) => trip.id)

  const { data: unreadCount } = useSuspenseQuery({
    queryKey: useTripUnreadCount.key(tripIds),
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
          { queryKey: useTripUnreadCount.rootKey() },
          (unreadCounts) => unreadCounts && increaseUnreadCount(unreadCounts, message.tripId),
        )
      })
      const unsubscribeLastRead = subscribeLastReadChange(() => {
        void queryClient.invalidateQueries({ queryKey: useTripUnreadCount.rootKey() })
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
useTripUnreadCount.rootKey = () => [tripChatKey, 'unread-counts']
useTripUnreadCount.key = (tripIds: string[]) => [...useTripUnreadCount.rootKey(), tripIds]
