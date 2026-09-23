import { assertEquals } from 'jsr:@std/assert@1'
import { toAirportArrivalPushMessage } from './push.ts'

const RECOMMENDED_ARRIVAL_AT = new Date('2026-09-24T07:30:00+09:00').toISOString()

Deno.test('제목은 혼잡도와 무관하게 고정 문구를 쓴다', () => {
  const message = toAirportArrivalPushMessage({
    recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT,
    congestionTier: 'calm',
  })

  assertEquals(message.title, '드디어 내일, 설레는 여행이 시작돼요!')
})

Deno.test('여유 등급은 여유롭다는 문구를 쓴다', () => {
  const message = toAirportArrivalPushMessage({
    recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT,
    congestionTier: 'calm',
  })

  assertEquals(message.body, '공항이 여유로울 것으로 예상돼요. 07:30까지 공항에 도착하는 것을 권장해요.')
})

Deno.test('보통 등급은 여유로운 탑승 문구를 쓴다', () => {
  const message = toAirportArrivalPushMessage({
    recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT,
    congestionTier: 'normal',
  })

  assertEquals(message.body, '여유로운 탑승을 위해 07:30까지 공항에 도착하는 걸 권장해요.')
})

Deno.test('혼잡 등급은 혼잡하다는 문구를 쓴다', () => {
  const message = toAirportArrivalPushMessage({
    recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT,
    congestionTier: 'crowded',
  })

  assertEquals(message.body, '공항이 혼잡할 것으로 예상돼요. 07:30까지 공항에 도착하는 것을 권장해요.')
})

Deno.test('매우 혼잡 등급은 서두르라는 문구를 쓴다', () => {
  const message = toAirportArrivalPushMessage({
    recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT,
    congestionTier: 'veryCrowded',
  })

  assertEquals(message.body, '공항이 매우 혼잡할 것으로 예상돼요. 서둘러 07:30까지 도착해 주세요.')
})
