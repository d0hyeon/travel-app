import { describe, expect, it } from 'vitest'
import type { HourlyWeatherForecast } from '../weather.types'
import { hasDayPartForecast, isInDayPart } from '../dayPart.utils'

const EMPTY_FORECAST = {
  temperature: null,
  humidity: null,
  skyCondition: null,
  precipitationType: 'none',
  precipitationProbability: null,
  precipitationAmount: null,
  windDirection: null,
  windSpeed: null,
} satisfies Omit<HourlyWeatherForecast, 'forecastAt'>

function hourlyAt(...hours: number[]): HourlyWeatherForecast[] {
  return hours.map((hour) => ({
    ...EMPTY_FORECAST,
    forecastAt: `2026-08-10T${String(hour).padStart(2, '0')}:00:00+09:00`,
  }))
}

describe('isInDayPart', () => {
  it('0시부터 11시까지는 오전이다', () => {
    expect(isInDayPart('2026-08-10T00:00:00+09:00', 'am')).toBe(true)
    expect(isInDayPart('2026-08-10T11:00:00+09:00', 'am')).toBe(true)
  })

  it('12시부터 23시까지는 오후다', () => {
    expect(isInDayPart('2026-08-10T12:00:00+09:00', 'pm')).toBe(true)
    expect(isInDayPart('2026-08-10T23:00:00+09:00', 'pm')).toBe(true)
  })

  it('정오는 오전이 아니라 오후다', () => {
    expect(isInDayPart('2026-08-10T12:00:00+09:00', 'am')).toBe(false)
  })
})

describe('hasDayPartForecast', () => {
  it('해당 시간대의 예보가 하나라도 있으면 true 다', () => {
    expect(hasDayPartForecast(hourlyAt(9, 15), 'am')).toBe(true)
    expect(hasDayPartForecast(hourlyAt(9, 15), 'pm')).toBe(true)
  })

  it('예보가 오후에만 있으면 오전은 false 다', () => {
    expect(hasDayPartForecast(hourlyAt(13, 18), 'am')).toBe(false)
  })

  it('예보가 오전에만 있으면 오후는 false 다', () => {
    expect(hasDayPartForecast(hourlyAt(1, 8), 'pm')).toBe(false)
  })

  it('예보가 비어 있으면 어느 시간대도 false 다', () => {
    expect(hasDayPartForecast([], 'am')).toBe(false)
    expect(hasDayPartForecast([], 'pm')).toBe(false)
  })
})
