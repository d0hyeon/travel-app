import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@waylog/domains/clients'
import type { AuthService, AuthUser } from '@waylog/domains/clients'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as WebBrowser from 'expo-web-browser'

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.name ?? user.user_metadata?.full_name,
    avatar: user.user_metadata?.picture,
  }
}

function readAuthCode(callbackUrl: string) {
  const { searchParams } = new URL(callbackUrl)
  return searchParams.get('code')
}

const APPLE_REQUEST_CANCELED = 'ERR_REQUEST_CANCELED'

function isAppleRequestCanceled(error: unknown) {
  return typeof error === 'object' && error != null && 'code' in error && error.code === APPLE_REQUEST_CANCELED
}

async function signInWithAppleNative(client: SupabaseClient<Database>) {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  }).catch((error: unknown) => {
    if (isAppleRequestCanceled(error)) return null
    throw error
  })
  if (credential == null) return false
  if (credential.identityToken == null) throw new Error('Apple 로그인 응답에 인증 토큰이 없습니다')

  const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken })
  if (error) throw error

  const { givenName, familyName } = credential.fullName ?? {}
  const fullName = [familyName, givenName].filter(Boolean).join('')

  const { error: updateError } = await client.auth.updateUser({
    data: {
      ...(fullName === '' ? {} : { full_name: fullName }),
      apple_authorization_code: credential.authorizationCode,
    },
  })
  if (updateError) throw updateError
  return true
}

export function createAuthService(client: SupabaseClient<Database>): AuthService {
  return {
    async readSession() {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      return data.session == null ? null : { user: toAuthUser(data.session.user) }
    },
    async readTokens() {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      if (data.session == null) return null
      return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token }
    },
    async signIn(input) {
      const { error } = await client.auth.signInWithPassword(input)
      if (error) throw error
    },
    async signInWithProvider({ provider, redirectTo }) {
      if (provider === 'apple') return signInWithAppleNative(client)

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
    async requestAppleAuthorizationCode() {
      const { data, error } = await client.auth.getUser()
      if (error) throw error
      if (data.user.app_metadata.provider !== 'apple') return undefined

      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] })
      return credential.authorizationCode ?? undefined
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
