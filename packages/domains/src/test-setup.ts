import { createClient } from '@supabase/supabase-js'
import type { AuthService } from './auth'
import { initApi } from './api'

const client = createClient('https://placeholder.supabase.co', 'placeholder')
const authService: AuthService = {
  readSession: async () => null,
  signIn: async () => {},
  signInWithProvider: async () => {},
  signOut: async () => {},
  onAuthStateChange: () => () => {},
}

initApi({ client, authService, url: 'https://placeholder.supabase.co', anonKey: 'placeholder' })
