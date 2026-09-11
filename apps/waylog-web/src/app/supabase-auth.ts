import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@waylog/domains/clients'
import type { AuthService, AuthUser } from '@waylog/domains/clients'

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.name,
    avatar: user.user_metadata?.picture,
  }
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
      const { error } = await client.auth.signInWithOAuth({ provider: `custom:${provider}` as never, options: { redirectTo } })
      if (error) throw error
      // 브라우저가 그대로 인증 페이지로 떠나므로 취소를 돌려받을 지점이 없다.
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
