export interface AuthUser {
  id: string
}
export interface AuthSession { user: AuthUser }
export type AuthProvider = 'kakao'
export interface AuthService {
  readSession(): Promise<AuthSession | null>
  signIn(input: { email: string; password: string }): Promise<void>
  signInWithProvider(input: { provider: AuthProvider; redirectTo: string }): Promise<void>
  signOut(): Promise<void>
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
