import { assertEquals } from 'jsr:@std/assert@1'
import { toAirportArrivalPushMessage } from './push.ts'

Deno.test('권장 도착 시각을 HH:mm 으로 표시한 문구를 만든다', () => {
  const message = toAirportArrivalPushMessage({
    recommendedArrivalAt: new Date('2026-09-24T07:30:00+09:00').toISOString(),
  })

  assertEquals(message.body, '07:30까지 공항 도착을 권장해요')
})
