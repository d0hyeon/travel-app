import { describe, expect, it } from "vitest";
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'

describe('isTripChatPushData', () => {
  it('채팅 메시지 푸시 데이터를 수용한다', () => {
    expect(isTripChatPushData({ tripId: 'trip-1' })).toBe(true)
  })

  it('교통편 식별자가 든 운항 상태 알림은 수용하지 않는다', () => {
    expect(isTripChatPushData({ tripId: 'trip-1', transportId: 'transport-1' })).toBe(false)
  })
})
