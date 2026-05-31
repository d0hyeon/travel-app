import { useState, useEffect } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getChatMessages, tripChatKey } from './tripChat.api'
import type { ChatMessage } from './tripChat.types'
import { useStorageStore } from '~shared/hooks/useStorageStore'
import { useTripChatMessages } from './useTripChatMessages'

const STORAGE_KEY = (tripId: string) => `chat_last_read_${tripId}`

const emitter = new EventTarget()
const MARK_READ_EVENT = 'mark-read'

export function getLastReadAt(tripId: string): string | null {
  return localStorage.getItem(STORAGE_KEY(tripId))
}

export function markAsRead(tripId: string, lastMessageAt?: string): void {
  const ts = lastMessageAt ?? new Date().toISOString()
  localStorage.setItem(STORAGE_KEY(tripId), ts)
  emitter.dispatchEvent(new CustomEvent(MARK_READ_EVENT, { detail: { tripId, ts } }))
}

export function getUnreadCount(tripId: string, messages: ChatMessage[]): number {
  const lastReadAt = getLastReadAt(tripId)
  if (!lastReadAt) return messages.length
  return messages.filter((m) => m.createdAt > lastReadAt).length
}

export function useUnreadChatCount(tripId: string): number {
  const { data: messages } = useTripChatMessages(tripId)

  const [lastReadAt, setLastReadAt] = useState(() => getLastReadAt(tripId))

  useEffect(() => {
    const handler = (e: Event) => {
      const { tripId: id, ts } = (e as CustomEvent).detail
      if (id === tripId) setLastReadAt(ts)
    }
    emitter.addEventListener(MARK_READ_EVENT, handler)
    return () => emitter.removeEventListener(MARK_READ_EVENT, handler)
  }, [tripId])

  if (!lastReadAt) return messages.length
  return messages.filter((m) => m.createdAt > lastReadAt).length
}
