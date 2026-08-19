import { supabase } from '@waylog/domains/api'
import type { UserProfile } from './user-profile.type'

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
