import { supabase } from '~api/client';
import { getAuth } from '~features/auth/useAuth';
import type { TripMember } from './tripMember.types';

export const tripMemberKey = 'trip_members';

export async function getTripMembersByTripId(tripId: string): Promise<TripMember[]> {
  const { data: trip, error } = await supabase.from('trips').select('*').eq('id', tripId).single();
  if (error) throw error;
  
  const { data: members, error: memberError } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (memberError) throw memberError

  const userIds = [trip.user_id, ...members.map((m) => m.user_id)].filter(x => x != null);
  const memberIdMap = Object.fromEntries(members.map(x => ([x.user_id, x.id])));
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', userIds);
  if (profileError) throw profileError;

  return profiles.map((profile) => ({
    tripId,
    id: memberIdMap[profile.id],
    userId: profile.id,
    name: profile.name,
    profileUrl: profile.avatar_url,
    isHost: trip.user_id === profile.id,
  } satisfies TripMember))
  
}

export async function joinTrip(tripId: string): Promise<void> {
  const user = getAuth()
  if (!user) throw new Error('로그인이 필요합니다')

  const { error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: user.id } as never)

  // 이미 멤버인 경우 무시
  if (error && error.code !== '23505') throw error
}

export async function leaveTrip(tripId: string): Promise<void> {
  const user = getAuth()
  if (!user) throw new Error('로그인이 필요합니다')

  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', user.id)

  if (error) throw error
}
