import { http, HttpResponse } from 'msw'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'

export const MOCK_MESSAGES = [
  {
    id: 'msg-001',
    trip_id: MOCK_TRIP_ID,
    user_id: 'user-001',
    content: '안녕하세요!',
    created_at: '2026-05-31T10:00:00Z',
  },
  {
    id: 'msg-002',
    trip_id: MOCK_TRIP_ID,
    user_id: 'user-002',
    content: '반가워요 :)',
    created_at: '2026-05-31T10:01:00Z',
  },
]

export default [
  http.get('*/rest/v1/trip_messages', () =>
    HttpResponse.json(MOCK_MESSAGES)
  ),
  http.post('*/rest/v1/trip_messages', () =>
    HttpResponse.json(MOCK_MESSAGES[0], { status: 201 })
  ),
]
