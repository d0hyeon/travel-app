import { supabase } from '~api/client'

export async function signInWithKakao() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'custom:kakao' as never,
    options: {
      redirectTo: window.location.origin,
    },
  })
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
      { ...payload, avatar_url: avatar } as never,
      { onConflict: 'id' }
    )
}
