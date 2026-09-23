import { assertEquals } from 'jsr:@std/assert@1'
import { toAirportArrivalPushMessage } from './push.ts'

const RECOMMENDED_ARRIVAL_AT = new Date('2026-09-24T07:30:00+09:00').toISOString()
const ROUTE = { departureCityName: '서울', arrivalCityName: '파리' }

Deno.test('제목은 혼잡도와 무관하게 고정 문구를 쓴다', () => {
  const message = toAirportArrivalPushMessage({ recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT, congestionTier: 'calm' }, ROUTE)

  assertEquals(message.title, '드디어 내일, 설레는 여행이 시작돼요!')
})

Deno.test('본문 첫 줄은 출발지에서 도착지로 가는 구간을 보여준다', () => {
  const message = toAirportArrivalPushMessage({ recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT, congestionTier: 'calm' }, ROUTE)

  assertEquals(message.body.split('\n')[0], '서울 → 파리')
})

Deno.test('여유 등급은 혼잡도 설명과 권장 시각을 다른 줄로 나눈다', () => {
  const message = toAirportArrivalPushMessage({ recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT, congestionTier: 'calm' }, ROUTE)

  assertEquals(message.body.split('\n'), [
    '서울 → 파리',
    '공항이 여유로울 것으로 예상돼요.',
    '07:30까지 공항에 도착하는 것을 권장해요.',
  ])
})

Deno.test('보통 등급은 한 문장으로 붙여 쓴다', () => {
  const message = toAirportArrivalPushMessage({ recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT, congestionTier: 'normal' }, ROUTE)

  assertEquals(message.body.split('\n'), ['서울 → 파리', '여유로운 탑승을 위해 07:30까지 공항에 도착하는 걸 권장해요.'])
})

Deno.test('혼잡 등급은 혼잡도 설명과 권장 시각을 다른 줄로 나눈다', () => {
  const message = toAirportArrivalPushMessage({ recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT, congestionTier: 'crowded' }, ROUTE)

  assertEquals(message.body.split('\n'), [
    '서울 → 파리',
    '공항이 혼잡할 것으로 예상돼요.',
    '07:30까지 공항에 도착하는 것을 권장해요.',
  ])
})

Deno.test('매우 혼잡 등급은 혼잡도 설명과 서두르라는 권고를 다른 줄로 나눈다', () => {
  const message = toAirportArrivalPushMessage({ recommendedArrivalAt: RECOMMENDED_ARRIVAL_AT, congestionTier: 'veryCrowded' }, ROUTE)

  assertEquals(message.body.split('\n'), [
    '서울 → 파리',
    '공항이 매우 혼잡할 것으로 예상돼요.',
    '서둘러 07:30까지 도착해 주세요.',
  ])
})
