export interface AuthUser {
  id: string
  name?: string
  avatar?: string
}
export interface AuthSession { user: AuthUser }
export interface AuthTokens { accessToken: string; refreshToken: string }
export type AuthProvider = 'kakao' | 'apple'
export interface AuthService {
  readSession(): Promise<AuthSession | null>
  readTokens(): Promise<AuthTokens | null>
  signIn(input: { email: string; password: string }): Promise<void>
  /** 사용자가 인증 창을 닫으면 false. 세션이 생기면 true. */
  signInWithProvider(input: { provider: AuthProvider; redirectTo: string }): Promise<boolean>
  signOut(): Promise<void>
  requestAppleAuthorizationCode(): Promise<string | undefined>
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void
}
