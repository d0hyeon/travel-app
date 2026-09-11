export interface AuthUser {
  id: string
  name?: string
  avatar?: string
}
export interface AuthSession { user: AuthUser }
export type AuthProvider = 'kakao'
export interface AuthService {
  readSession(): Promise<AuthSession | null>
  signIn(input: { email: string; password: string }): Promise<void>
  /** 사용자가 인증 창을 닫으면 false. 세션이 생기면 true. */
  signInWithProvider(input: { provider: AuthProvider; redirectTo: string }): Promise<boolean>
  signOut(): Promise<void>
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
