import { createClient } from '@supabase/supabase-js'
import type { AuthService } from './gateways/auth'
import { initializeClient } from './gateways/client'

const client = createClient('https://placeholder.supabase.co', 'placeholder')
const authService: AuthService = {
  readSession: async () => null,
  readTokens: async () => null,
  signIn: async () => {},
  signInWithProvider: async () => true,
  signOut: async () => {},
  requestAppleAuthorizationCode: async () => undefined,
  onAuthStateChange: () => () => {},
}

initializeClient({
  client,
  auth: authService,
  storage: {
    getItem: () => null,
    setItem: () => {},
  },
})
