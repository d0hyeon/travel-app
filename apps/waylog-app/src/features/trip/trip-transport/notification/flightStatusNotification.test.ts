import { describe, expect, it } from 'vitest'
import { isFlightStatusNotificationData } from './flightStatusNotification'

describe('isFlightStatusNotificationData', () => {
  it('운항 상태 알림 data 를 수용한다', () => {
    expect(isFlightStatusNotificationData({ tripId: 'trip-1', transportId: 'transport-1' })).toBe(true)
  })

  it('교통편 식별자가 없는 채팅 알림은 수용하지 않는다', () => {
    expect(isFlightStatusNotificationData({ tripId: 'trip-1' })).toBe(false)
  })
})
