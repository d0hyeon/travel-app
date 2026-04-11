import { supabase } from '~api/client'
import type { TripMember } from './tripMember.types'

export const tripMemberKey = 'trip_members';

export async function getTripMembersByTripId(tripId: string): Promise<TripMember[]> {
  const { data: members, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!members?.length) return []

  const userIds = members.map((m) => m.user_id).filter(Boolean) as string[]

  const profileMap = new Map<string, { name: string; avatar_url: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds)

    if (profileError) throw profileError
    profiles?.forEach((p) => profileMap.set(p.id, p))
  }

  return members.map((m) => {
    const profile = m.user_id ? profileMap.get(m.user_id) : null
    return {
      id: m.id,
      tripId: m.trip_id,
      userId: m.user_id,
      name: profile!.name,
      user: {
        id: m.user_id,
        name: profile?.name ?? '',
        avatarUrl: profile?.avatar_url ?? null,
      },
      createdAt: m.created_at,
    }
  })
}

export async function joinTrip(tripId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('로그인이 필요합니다')

  const { error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: user.id } as never)

  // 이미 멤버인 경우 무시
  if (error && error.code !== '23505') throw error
}

export async function deleteTripMember(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
