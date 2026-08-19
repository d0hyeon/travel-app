import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../../../../mocks/handlers'
import { MOCK_MESSAGES } from '../tripChat.mock'
import { getChatMessages, sendChatMessage } from '../tripChat.api'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'
import { MOCK_SESSION } from '~features/auth/auth.mock'
import { queryClient } from '~app/query-client'

const server = setupServer(...handlers)
beforeAll(() => {
  server.listen()
  queryClient.setQueryData(['auth'], MOCK_SESSION.user)
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('getChatMessages', () => {
  it('trip_id로 메시지 목록을 반환한다', async () => {
    const messages = await getChatMessages(MOCK_TRIP_ID)
    expect(messages).toHaveLength(2)
    expect(messages[0].id).toBe(MOCK_MESSAGES[0].id)
    expect(messages[0].tripId).toBe(MOCK_TRIP_ID)
    expect(messages[0].content).toBe('안녕하세요!')
  })
})

describe('sendChatMessage', () => {
  it('메시지를 전송하고 ChatMessage를 반환한다', async () => {
    const result = await sendChatMessage(MOCK_TRIP_ID, '테스트 메시지')
    expect(result.id).toBe(MOCK_MESSAGES[0].id)
    expect(result.tripId).toBe(MOCK_TRIP_ID)
  })
})
