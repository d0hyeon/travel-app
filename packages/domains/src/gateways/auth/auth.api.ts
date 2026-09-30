import { supabase } from '../client'
import { getAuthService } from './auth.service'

export async function signInWithKakao({ redirectTo }: { redirectTo: string }) {
  return getAuthService().signInWithProvider({ provider: 'kakao', redirectTo })
}
export async function signInWithEmail(email: string, password: string) {
  await getAuthService().signIn({ email, password })
}
export async function signOut() { await getAuthService().signOut() }
export async function getCurrentUser() { return (await getAuthService().readSession())?.user ?? null }
export async function readAuthTokens() { return getAuthService().readTokens() }

export async function cancelSignUp() {
  const { error } = await supabase.functions.invoke('cancel-sign-up')
  if (error) throw error
  await getAuthService().signOut()
}
