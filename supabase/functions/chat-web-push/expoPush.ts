const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Expo 는 한 번에 100건까지 받는다.
const CHUNK_SIZE = 100

export interface ExpoPushPayload {
  title: string
  body: string
  data: Record<string, unknown>
}

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

/**
 * Expo Push Service 로 알림을 보낸다.
 *
 * 웹푸시(VAPID)와 달리 토큰만 있으면 되고, Expo 가 APNs·FCM 으로 갈라 보낸다.
 * 앱 쪽 자격증명은 Expo 계정에 등록돼 있어야 한다.
 */
export async function sendExpoPush(
  tokens: string[],
  payload: ExpoPushPayload,
): Promise<{ sent: number; invalidTokens: string[] }> {
  const invalidTokens: string[] = []
  let sent = 0

  for (let index = 0; index < tokens.length; index += CHUNK_SIZE) {
    const chunk = tokens.slice(index, index + CHUNK_SIZE)

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(
        chunk.map((token) => ({
          to: token,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: 'default',
        })),
      ),
    })

    if (!response.ok) {
      console.error('Expo push HTTP error:', response.status, await response.text())
      continue
    }

    const { data: tickets } = (await response.json()) as { data?: ExpoPushTicket[] }
    if (tickets == null) continue

    tickets.forEach((ticket, ticketIndex) => {
      if (ticket.status === 'ok') {
        sent += 1
        return
      }

      console.error('Expo push ticket error:', ticket.message)

      // 앱이 지워졌거나 토큰이 죽었다. 지워야 다음부터 안 보낸다.
      if (ticket.details?.error === 'DeviceNotRegistered') {
        invalidTokens.push(chunk[ticketIndex])
      }
    })
  }

  return { sent, invalidTokens }
}

/** Expo 토큰은 ExponentPushToken[...] 또는 ExpoPushToken[...] 형태다. */
export function isExpoPushToken(endpoint: string): boolean {
  return endpoint.startsWith('ExponentPushToken[') || endpoint.startsWith('ExpoPushToken[')
}
