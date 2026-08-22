import { createClient } from '@supabase/supabase-js'
import type { AuthService } from './auth'
import { initializeClient } from './api'

const client = createClient('https://placeholder.supabase.co', 'placeholder')
const authService: AuthService = {
  readSession: async () => null,
  signIn: async () => {},
  signInWithProvider: async () => {},
  signOut: async () => {},
  onAuthStateChange: () => () => {},
}

initializeClient({ client, auth: authService })
