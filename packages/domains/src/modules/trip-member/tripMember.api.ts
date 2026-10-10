import { supabase } from '../../gateways/client';
import { AuthError, getAuth } from '../../gateways/auth';
import { LEFT_MEMBER_NAME, type TripMember } from './tripMember.types';

export const tripMemberKey = 'trip_members';

export type LeaveTripResult = 'left' | 'last_member';

const LAST_MEMBER_ERROR_MESSAGE = 'last_member';

interface TripMemberSource {
  tripId: string
  tripCreatedAt: string
  hostUserId: string | null
  membership: { id: string; created_at: string; left_at: string | null } | undefined
  profile: { id: string; name: string; avatar_url: string | null }
}

export function toTripMember({ tripId, tripCreatedAt, hostUserId, membership, profile }: TripMemberSource): TripMember {
  const hasLeft = membership?.left_at != null
  return {
    tripId,
    id: membership?.id ?? profile.id,
    userId: profile.id,
    name: hasLeft ? LEFT_MEMBER_NAME : profile.name,
    profileUrl: hasLeft ? null : profile.avatar_url,
    isHost: hostUserId === profile.id,
    hasLeft,
    joinedAt: membership?.created_at ?? tripCreatedAt,
  }
}

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
  const membershipByUserId = Object.fromEntries(members.map(x => ([x.user_id, x])));
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', userIds);
  if (profileError) throw profileError;

  return profiles.map((profile) => toTripMember({
    tripId,
    tripCreatedAt: trip.created_at,
    hostUserId: trip.user_id,
    membership: membershipByUserId[profile.id],
    profile,
  }))
}

export async function joinTrip(shareLink: string): Promise<void> {
  const user = getAuth()
  if (!user) throw new AuthError()

  const { error } = await supabase.rpc('join_trip', { p_share_link: shareLink })
  if (error) throw error
}

export async function leaveTrip(tripId: string): Promise<LeaveTripResult> {
  const user = getAuth()
  if (!user) throw new AuthError()

  const { error } = await supabase.rpc('leave_trip', { p_trip_id: tripId })
  if (error?.message === LAST_MEMBER_ERROR_MESSAGE) return 'last_member'
  if (error) throw error
  return 'left'
}
