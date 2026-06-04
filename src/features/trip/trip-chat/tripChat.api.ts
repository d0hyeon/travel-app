import { supabase } from '~api/client'
import { getAuth } from '~features/auth/useAuth'
import type { ChatMessage } from './tripChat.types'
import type { DataRaw } from '~api/tables.types'

export const tripChatKey = 'trip_messages'

function toMessage(row: {
  id: string
  trip_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}): ChatMessage {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function getChatMessages(tripId: string): Promise<Omit<ChatMessage, 'profile'>[]> {
  const { data, error } = await supabase
    .from('trip_messages')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toMessage)
}

export function subscribeTripMessages(
  tripId: string,
  callback: (data: ChatMessage) => void
) {
  const channel = supabase
    .channel(`trip_messages:${tripId}`)
    .on<DataRaw<'trip_messages'>>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'trip_messages' },
      ({ new: row }) => {
        if (row.trip_id !== tripId) return
        const newMessage: ChatMessage = {
          id: row.id,
          tripId: row.trip_id,
          userId: row.user_id,
          userName: row.user_name,
          content: row.content,
          createdAt: row.created_at,
        }
        callback(newMessage)
      }
    )
    .subscribe()
  
  return () => { void supabase.removeChannel(channel) }

  
}

export function subscribeAllTripMessages(
  callback: (data: ChatMessage) => void
) {
  const channel = supabase
    .channel('trip_messages:all')
    .on<DataRaw<'trip_messages'>>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'trip_messages' },
      ({ new: row }) => callback({
        id: row.id,
        tripId: row.trip_id,
        userId: row.user_id,
        userName: row.user_name,
        content: row.content,
        createdAt: row.created_at,
      })
    )
    .subscribe()

  return () => { void supabase.removeChannel(channel) }
}

export async function sendChatMessage(tripId: string, content: string): Promise<ChatMessage> {
  const user = getAuth()
  if (!user) throw new Error('로그인이 필요합니다')
    
  const { data, error } = await supabase
    .from('trip_messages')
    .insert({ trip_id: tripId, user_id: user.id, user_name: user.profile.name, content })
    .select()
    .single()

  if (error) throw error

  supabase.functions.invoke('chat-web-push', {
    body: {
      tripId,
      senderId: user.id,
      body: `${user.profile.name }: ${content.length > 50 ? content.slice(0, 50) + '…' : content}`,
    },
  }).catch(() => {})

  return toMessage(data)
}
