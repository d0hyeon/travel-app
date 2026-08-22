import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@waylog/domains/api'
import type { AuthService } from '@waylog/domains/auth'

export function createAuthService(client: SupabaseClient<Database>): AuthService {
  return {
    async readSession() {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      return data.session == null ? null : { user: { id: data.session.user.id } }
    },
    async signIn(input) {
      const { error } = await client.auth.signInWithPassword(input)
      if (error) throw error
    },
    async signInWithProvider({ provider, redirectTo }) {
      const { error } = await client.auth.signInWithOAuth({ provider: `custom:${provider}` as never, options: { redirectTo } })
      if (error) throw error
    },
    async signOut() {
      const { error } = await client.auth.signOut()
      if (error) throw error
    },
    onAuthStateChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => callback(session == null ? null : { user: { id: session.user.id } }))
      return () => data.subscription.unsubscribe()
    },
  }
}
