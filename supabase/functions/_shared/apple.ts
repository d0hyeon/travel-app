import { importPKCS8, SignJWT } from 'https://esm.sh/jose@5'

const APPLE_ISSUER = 'https://appleid.apple.com'
const APPLE_TOKEN_URL = `${APPLE_ISSUER}/auth/token`
const APPLE_REVOKE_URL = `${APPLE_ISSUER}/auth/revoke`
const CLIENT_SECRET_LIFETIME = '5m'

interface AppleCredentials {
  teamId: string
  keyId: string
  clientId: string
  privateKey: string
}

function readAppleCredentials(): AppleCredentials | null {
  const teamId = Deno.env.get('APPLE_TEAM_ID')
  const keyId = Deno.env.get('APPLE_KEY_ID')
  const clientId = Deno.env.get('APPLE_CLIENT_ID')
  const privateKey = Deno.env.get('APPLE_PRIVATE_KEY')
  if (!teamId || !keyId || !clientId || !privateKey) return null

  return { teamId, keyId, clientId, privateKey: privateKey.replace(/\\n/g, '\n') }
}

async function createClientSecret({ teamId, keyId, clientId, privateKey }: AppleCredentials) {
  const signingKey = await importPKCS8(privateKey, 'ES256')

  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime(CLIENT_SECRET_LIFETIME)
    .setAudience(APPLE_ISSUER)
    .setSubject(clientId)
    .sign(signingKey)
}

function postForm(url: string, params: Record<string, string>) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
}

export async function revokeAppleAuthorization(authorizationCode: string): Promise<boolean> {
  const credentials = readAppleCredentials()
  if (credentials == null) return false

  const clientSecret = await createClientSecret(credentials)
  const clientParams = { client_id: credentials.clientId, client_secret: clientSecret }

  const tokenResponse = await postForm(APPLE_TOKEN_URL, {
    ...clientParams,
    code: authorizationCode,
    grant_type: 'authorization_code',
  })
  if (!tokenResponse.ok) return false

  const { refresh_token: refreshToken } = await tokenResponse.json()
  if (typeof refreshToken !== 'string') return false

  const revokeResponse = await postForm(APPLE_REVOKE_URL, {
    ...clientParams,
    token: refreshToken,
    token_type_hint: 'refresh_token',
  })
  return revokeResponse.ok
}
