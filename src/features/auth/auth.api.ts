import { supabase } from '~api/client'
import type { CreateDataType, Json } from '~api/tables.types'

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

export function addPushSubscription(userId: string, subscription: PushSubscription) {
  return supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription: subscription as unknown as Json,
    keys: subscription.toJSON().keys,
  })
}