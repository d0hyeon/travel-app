import { supabase } from '@waylog/domains/api'
import type { CreateDataType, DataRaw, Json } from '@waylog/domains/api'

interface SignInWIthKakaoOptions {
  redirectTo?: string;
}
export async function signInWithKakao({ redirectTo = window.location.origin }: SignInWIthKakaoOptions = {}) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'custom:kakao' as never,
    options: {
      redirectTo,
    },
  })
  if (error) throw error
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

interface UpdateProfilePayload {
  id: string;
  name?: string;
  avatar?: string;
}

export async function updateProfile({ avatar, ...payload }: UpdateProfilePayload) {
  await supabase
    .from('user_profiles')
    .upsert(
      { ...payload, avatar_url: avatar } satisfies CreateDataType<'user_profiles'>,
      { onConflict: 'id' }
    )
}

export async function addPushSubscription(userId: string, subscription: PushSubscription) {
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription: subscription.toJSON() as Json,
  }, { onConflict: 'user_id,endpoint' })
  if (error) throw error
}

export async function removePushSubscription(userId: string, endpoint: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
  if (error) throw error
}

export async function findPushSubscription(userId: string, endpoint: string): Promise<DataRaw<'push_subscriptions'> | null> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .maybeSingle()
  if (error) throw error
  return data
}