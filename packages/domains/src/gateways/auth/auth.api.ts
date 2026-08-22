import { getAuthService } from './auth.service'

export async function signInWithKakao({ redirectTo }: { redirectTo: string }) {
  await getAuthService().signInWithProvider({ provider: 'kakao', redirectTo })
}
export async function signInWithEmail(email: string, password: string) {
  await getAuthService().signIn({ email, password })
}
export async function signOut() { await getAuthService().signOut() }
export async function getCurrentUser() { return (await getAuthService().readSession())?.user ?? null }
