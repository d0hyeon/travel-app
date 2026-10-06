import { describe, expect, it } from 'vitest'
import { parseChatPushNotification } from '../service-workers/chatPushNotification'

describe('parseChatPushNotification', () => {
  it('채팅 알림만 수용한다', () => {
    expect(
      parseChatPushNotification({
        title: '여행 채팅',
        body: '새 메시지',
        tripId: 'trip-1',
      }),
    ).toEqual({
      title: '여행 채팅',
      body: '새 메시지',
      tripId: 'trip-1',
    })
  })

  it('교통편 식별자가 든 항공편 알림은 수용하지 않는다', () => {
    expect(
      parseChatPushNotification({
        title: '운항 정보',
        body: '탑승구가 변경됐어요',
        tripId: 'trip-1',
        transportId: 'transport-1',
      }),
    ).toBeNull()
  })
})
