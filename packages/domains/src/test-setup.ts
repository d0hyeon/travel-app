import { createClient } from '@supabase/supabase-js'
import type { AuthService } from './gateways/auth'
import { initializeClient } from './gateways/client'

const client = createClient('https://placeholder.supabase.co', 'placeholder')
const authService: AuthService = {
  readSession: async () => null,
  signIn: async () => {},
  signInWithProvider: async () => {},
  signOut: async () => {},
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
