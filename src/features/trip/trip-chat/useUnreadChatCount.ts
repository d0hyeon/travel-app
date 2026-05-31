import { useSuspenseQuery } from '@tanstack/react-query'
import { getChatMessages, tripChatKey } from './tripChat.api'
import type { ChatMessage } from './tripChat.types'

const STORAGE_KEY = (tripId: string) => `chat_last_read_${tripId}`

export function getLastReadAt(tripId: string): string | null {
  return localStorage.getItem(STORAGE_KEY(tripId))
}

export function markAsRead(tripId: string): void {
  localStorage.setItem(STORAGE_KEY(tripId), new Date().toISOString())
}

export function getUnreadCount(tripId: string, messages: ChatMessage[]): number {
  const lastReadAt = getLastReadAt(tripId)
  if (!lastReadAt) return messages.length
  return messages.filter((m) => m.createdAt > lastReadAt).length
}

export function useUnreadChatCount(tripId: string): number {
  const { data: messages } = useSuspenseQuery({
    queryKey: [tripChatKey, 'list', tripId],
    queryFn: () => getChatMessages(tripId),
    staleTime: 30 * 1000,
  })
  return getUnreadCount(tripId, messages)
}
