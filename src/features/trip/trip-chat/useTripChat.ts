import { useEffect } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { supabase } from '~api/client'
import { getChatMessages, tripChatKey } from './tripChat.api'
import type { ChatMessage } from './tripChat.types'

export function useTripChat(tripId: string) {
  const queryClient = useQueryClient()

  const { data: messages } = useSuspenseQuery({
    queryKey: [tripChatKey, 'list', tripId],
    queryFn: () => getChatMessages(tripId),
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`trip_messages:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_messages', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const row = payload.new as {
            id: string; trip_id: string; user_id: string; content: string; created_at: string
          }
          const newMessage: ChatMessage = {
            id: row.id,
            tripId: row.trip_id,
            userId: row.user_id,
            content: row.content,
            createdAt: row.created_at,
          }
          queryClient.setQueryData<ChatMessage[]>(
            [tripChatKey, 'list', tripId],
            (prev) => [...(prev ?? []), newMessage]
          )
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [tripId, queryClient])

  return { messages }
}
