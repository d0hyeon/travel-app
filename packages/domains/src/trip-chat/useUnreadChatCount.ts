import { useState, useEffect } from 'react'
import type { ChatMessage } from './tripChat.types'
import { getLastReadStore } from './lastReadStore'
import { useTripChatMessages } from './useTripChatMessages'

const STORAGE_KEY = (tripId: string) => `chat_last_read_${tripId}`

// 웹은 EventTarget 을 썼지만 RN 에 없다. 구독을 직접 들고 있는다.
const listeners = new Set<(tripId: string, lastReadAt: string) => void>()

export function getLastReadAt(tripId: string): string | null {
  return getLastReadStore().get(STORAGE_KEY(tripId))
}

export function markAsRead(tripId: string, lastMessageAt?: string): void {
  const lastReadAt = lastMessageAt ?? new Date().toISOString()
  getLastReadStore().set(STORAGE_KEY(tripId), lastReadAt)
  listeners.forEach((notify) => notify(tripId, lastReadAt))
}

export function getUnreadCount(tripId: string, messages: ChatMessage[]): number {
  return countAfter(getLastReadAt(tripId), messages)
}

export function useUnreadChatCount(tripId: string): number {
  const { data: messages } = useTripChatMessages(tripId)

  const [lastReadAt, setLastReadAt] = useState(() => getLastReadAt(tripId))

  useEffect(() => {
    const notify = (changedTripId: string, changedAt: string) => {
      if (changedTripId === tripId) setLastReadAt(changedAt)
    }
    listeners.add(notify)
    return () => void listeners.delete(notify)
  }, [tripId])

  return countAfter(lastReadAt, messages)
}

/** 읽은 시각이 없으면 전부 안읽음이다. */
function countAfter(lastReadAt: string | null, messages: ChatMessage[]): number {
  if (!lastReadAt) return messages.length
  return messages.filter((message) => message.createdAt > lastReadAt).length
}
