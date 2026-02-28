import { supabase } from '../../../shared/lib/supabase'
import type { TripMember } from './tripMember.types'

export const tripMemberKey = 'trip_members'

function toTripMember(row: {
  id: string
  trip_id: string
  name: string
  emoji: string
  created_at: string
}): TripMember {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    emoji: row.emoji,
    createdAt: row.created_at,
  }
}

export async function getTripMembersByTripId(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toTripMember)
}

export async function createTripMember(data: Omit<TripMember, 'id' | 'createdAt'>): Promise<TripMember> {
  const { data: created, error } = await supabase
    .from('trip_members')
    .insert({
      trip_id: data.tripId,
      name: data.name,
      emoji: data.emoji,
    } as never)
    .select()
    .single()

  if (error) throw error
  return toTripMember(created!)
}

export async function updateTripMember(
  id: string,
  data: Partial<Pick<TripMember, 'name' | 'emoji'>>
): Promise<TripMember | undefined> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.emoji !== undefined) updateData.emoji = data.emoji

  const { data: updated, error } = await supabase
    .from('trip_members')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return updated ? toTripMember(updated) : undefined
}

export async function deleteTripMember(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
