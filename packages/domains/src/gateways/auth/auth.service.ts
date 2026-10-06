import type { AuthService } from './auth.types'

let service: AuthService | null = null

export function configureAuthService(value: AuthService) { service = value }

export function getAuthService(): AuthService {
  if (service == null) throw new Error('auth service를 사용하기 전에 configureAuthService()를 호출해야 합니다.')
  return service
}
