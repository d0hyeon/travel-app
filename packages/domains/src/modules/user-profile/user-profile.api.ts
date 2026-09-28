import { supabase, type CreateDataType } from '../../gateways/client'
import type { UserProfile } from '../user-profile'

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

interface CreateProfilePayload {
  id: string
  name?: string
  avatar?: string
}

const UNIQUE_VIOLATION = '23505'

// 로그인 이벤트는 신규 가입과 재로그인을 구분하지 못해 매 로그인마다 호출된다.
// 이미 프로필이 있으면 사용자가 수정한 값을 덮어쓰지 않도록 삽입만 시도하고 중복은 넘긴다.
export async function createProfileIfAbsent({ id, name, avatar }: CreateProfilePayload) {
  const { error } = await supabase
    .from('user_profiles')
    .insert({ id, name: name ?? '', avatar_url: avatar } satisfies CreateDataType<'user_profiles'>)

  if (error != null && error.code !== UNIQUE_VIOLATION) throw error
}
