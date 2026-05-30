import { http, HttpResponse } from "msw"

export const MOCK_USER_ID = 'test-user-001'
export const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: MOCK_USER_ID,
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: { name: '테스트 유저' },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
}

export default [
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json(MOCK_SESSION.user)
  }),
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json(MOCK_SESSION)
  }),
]