import { describe, expect, it } from 'vitest'
import { getFlightStatusNotificationDestination } from './flightStatusNotification'

describe('getFlightStatusNotificationDestination', () => {
  it('운항 상태 알림을 해당 탑승권 상세로 보낸다', () => {
    expect(
      getFlightStatusNotificationDestination({ tripId: 'trip-1', transportId: 'transport-1' }),
    ).toEqual({ tripId: 'trip-1', transportId: 'transport-1' })
  })

  it('교통편 식별자가 없는 채팅 알림은 수용하지 않는다', () => {
    expect(getFlightStatusNotificationDestination({ tripId: 'trip-1' })).toBeNull()
  })
})
