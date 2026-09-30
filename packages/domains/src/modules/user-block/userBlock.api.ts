import { assert } from '@waylog/utility'
import { getSession } from '../../gateways/auth'
import { supabase } from '../../gateways/client'
import type { UserProfile } from '../user-profile'
import { getUserProfilesByIds } from '../user-profile/user-profile.api'

export const userBlockKey = 'user-blocks'

const UNIQUE_VIOLATION = '23505'

function getBlockerId() {
  const blocker = getSession()
  assert(blocker != null, '인증 정보가 만료되었습니다.')
  return blocker.id
}

export async function blockUser(blockedId: string) {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: getBlockerId(), blocked_id: blockedId })

  const isAlreadyBlocked = error?.code === UNIQUE_VIOLATION
  if (error != null && !isAlreadyBlocked) throw error
}

export async function unblockUser(blockedId: string) {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', getBlockerId())
    .eq('blocked_id', blockedId)

  if (error) throw error
}

export async function getBlockedUsers(): Promise<UserProfile[]> {
  const { data: blocks, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .order('created_at', { ascending: false })
  if (error) throw error

  const blockedIds = (blocks ?? []).map((block) => block.blocked_id)
  if (blockedIds.length === 0) return []

  const profiles = await getUserProfilesByIds(blockedIds)
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  return blockedIds.flatMap((blockedId) => profilesById.get(blockedId) ?? [])
}
