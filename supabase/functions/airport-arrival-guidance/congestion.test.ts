import { assertEquals, assertNotEquals } from 'jsr:@std/assert@1'
import { toCongestionSnapshotKey } from './congestion.ts'

Deno.test('출처·공항·터미널이 같으면 같은 키다', () => {
  const first = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T1' })
  const second = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T1' })

  assertEquals(first, second)
})

Deno.test('출처가 다르면 다른 키다', () => {
  const forecast = toCongestionSnapshotKey({
    sourceKind: 'forecast',
    airportCode: 'ICN',
    terminal: 'T1',
    forecastDate: '0',
  })
  const realtime = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T1' })

  assertNotEquals(forecast, realtime)
})

Deno.test('터미널이 다르면 다른 키다', () => {
  const t1 = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T1' })
  const t2 = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T2' })

  assertNotEquals(t1, t2)
})

Deno.test('예측 스냅샷은 예측 날짜가 다르면 다른 키다', () => {
  const today = toCongestionSnapshotKey({
    sourceKind: 'forecast',
    airportCode: 'ICN',
    terminal: 'T1',
    forecastDate: '0',
  })
  const tomorrow = toCongestionSnapshotKey({
    sourceKind: 'forecast',
    airportCode: 'ICN',
    terminal: 'T1',
    forecastDate: '1',
  })

  assertNotEquals(today, tomorrow)
})

Deno.test('실시간 스냅샷은 예측 날짜가 있어도 없을 때와 같은 키다', () => {
  const withoutForecastDate = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T1' })
  const withForecastDate = toCongestionSnapshotKey({
    sourceKind: 'realtime',
    airportCode: 'ICN',
    terminal: 'T1',
    forecastDate: '0',
  })

  assertEquals(withoutForecastDate, withForecastDate)
})

Deno.test('국내와 실시간 스냅샷은 공항·터미널이 같아도 다른 키다', () => {
  const domestic = toCongestionSnapshotKey({ sourceKind: 'domestic', airportCode: 'ICN', terminal: 'T1' })
  const realtime = toCongestionSnapshotKey({ sourceKind: 'realtime', airportCode: 'ICN', terminal: 'T1' })

  assertNotEquals(domestic, realtime)
})

Deno.test('공항이 다르면 다른 키다', () => {
  const gimpo = toCongestionSnapshotKey({ sourceKind: 'domestic', airportCode: 'GMP', terminal: 'ALL' })
  const jeju = toCongestionSnapshotKey({ sourceKind: 'domestic', airportCode: 'CJU', terminal: 'ALL' })

  assertNotEquals(gimpo, jeju)
})
