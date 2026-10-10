import { supabase, type CreateDataType } from '../../gateways/client'
import type { UserProfile, UserTrip } from '../user-profile'
import { TERMS_VERSION } from '../terms'

export const userProfileKey = 'user-profile'

function toUserProfile(row: {
  id: string
  name: string
  avatar_url: string | null
}): UserProfile {
  return {
    id: row.id,
    name: row.name,
    profileUrl: row.avatar_url,
  }
}

export async function getUserTrips(userId: string): Promise<UserTrip[]> {
  const { data, error } = await supabase.rpc('get_user_trips', { p_user_id: userId })

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    destinations: row.destinations ?? [],
    endDate: row.end_date,
  }))
}

export async function getUserProfileById(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return toUserProfile(data)
}

export async function getUserProfilesByIds(ids: string[]): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .in('id', ids)

  if (error) throw error
  return (data ?? []).map(toUserProfile)
}

export interface UserProfileUpdate {
  name?: string
  profileUrl?: string
}

export async function updateUserProfile(id: string, patch: UserProfileUpdate): Promise<UserProfile> {
  const update: { name?: string; avatar_url?: string } = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.profileUrl !== undefined) update.avatar_url = patch.profileUrl

  const { data, error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('id', id)
    .select('id, name, avatar_url')
    .single()

  if (error) throw error
  return toUserProfile(data)
}

interface SignUpPayload {
  id: string
  name?: string
  avatar?: string
}

export async function signUp({ id, name, avatar }: SignUpPayload) {
  const { error } = await supabase.from('user_profiles').insert({
    id,
    name: name ?? '',
    avatar_url: avatar,
    terms_version: TERMS_VERSION,
    terms_agreed_at: new Date().toISOString(),
  } satisfies CreateDataType<'user_profiles'>)

  if (error) throw error
}
