import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@waylog/domains/clients'
import type { AuthService, AuthUser } from '@waylog/domains/clients'
import * as WebBrowser from 'expo-web-browser'

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.name,
    avatar: user.user_metadata?.picture,
  }
}

function readAuthCode(callbackUrl: string) {
  const { searchParams } = new URL(callbackUrl)
  return searchParams.get('code')
}

export function createAuthService(client: SupabaseClient<Database>): AuthService {
  return {
    async readSession() {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      return data.session == null ? null : { user: toAuthUser(data.session.user) }
    },
    async signIn(input) {
      const { error } = await client.auth.signInWithPassword(input)
      if (error) throw error
    },
    async signInWithProvider({ provider, redirectTo }) {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: `custom:${provider}` as never,
        // 네이티브에는 리다이렉트할 브라우저 문맥이 없다. 인증 URL만 받아 직접 띄운다.
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (error) throw error

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type !== 'success') return false

      const authCode = readAuthCode(result.url)
      if (authCode == null) throw new Error('카카오 로그인 응답에 인증 코드가 없습니다')

      const { error: exchangeError } = await client.auth.exchangeCodeForSession(authCode)
      if (exchangeError) throw exchangeError
      return true
    },
    async signOut() {
      const { error } = await client.auth.signOut()
      if (error) throw error
    },
    onAuthStateChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) =>
        callback(session == null ? null : { user: toAuthUser(session.user) }))
      return () => data.subscription.unsubscribe()
    },
  }
}
