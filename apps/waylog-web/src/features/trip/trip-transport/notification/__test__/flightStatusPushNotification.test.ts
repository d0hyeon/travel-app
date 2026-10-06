import { describe, expect, it } from 'vitest'
import { getFlightStatusPushDestination, parseFlightStatusPushNotification } from '../service-workers/flightStatusPushNotification'

describe('parseFlightStatusPushNotification', () => {
  it('교통편 식별자가 있는 운항 상태 알림만 수용한다', () => {
    expect(
      parseFlightStatusPushNotification({
        title: '운항 정보',
        body: '탑승구가 변경됐어요',
        tripId: 'trip-1',
        transportId: 'transport-1',
      }),
    ).toEqual({
      title: '운항 정보',
      body: '탑승구가 변경됐어요',
      tripId: 'trip-1',
      transportId: 'transport-1',
    })
  })

  it('교통편 식별자가 없는 채팅 알림은 수용하지 않는다', () => {
    expect(
      parseFlightStatusPushNotification({ title: '여행 채팅', body: '새 메시지', tripId: 'trip-1' }),
    ).toBeNull()
  })
})

describe('getFlightStatusPushDestination', () => {
  it('탑승권 상세로 이동한다', () => {
    expect(getFlightStatusPushDestination({ tripId: 'trip-1', transportId: 'transport-1' }))
      .toBe('/trip/trip-1/transport/transport-1')
  })
})
