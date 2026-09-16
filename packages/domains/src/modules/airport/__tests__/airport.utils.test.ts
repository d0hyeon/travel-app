import { describe, expect, it } from 'vitest'
import { AIRPORTS } from '../airport.data'
import { findAirport, searchAirports } from '../airport.utils'

describe('findAirport', () => {
  it('코드로 공항을 찾는다', () => {
    expect(findAirport('ICN')?.nameKo).toBe('인천국제공항')
  })

  it('없는 코드는 undefined 를 돌려준다', () => {
    expect(findAirport('XXX')).toBeUndefined()
  })
})

describe('searchAirports', () => {
  it('정식 명칭으로 찾는다', () => {
    const codes = searchAirports('인천국제공항').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('"공항"을 뺀 통칭으로도 찾는다', () => {
    const codes = searchAirports('인천공항').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('도시 이름으로 찾는다', () => {
    const codes = searchAirports('오사카').map((a) => a.code)
    expect(codes).toContain('KIX')
  })

  it('IATA 코드로 찾는다', () => {
    const codes = searchAirports('icn').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('영문명으로 찾는다', () => {
    const codes = searchAirports('incheon').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('aliases 로 찾는다', () => {
    const codes = searchAirports('부산').map((a) => a.code)
    expect(codes).toContain('PUS')
  })

  it('공백은 무시한다', () => {
    const codes = searchAirports('인천 공항').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('빈 키워드는 전체를 돌려준다', () => {
    expect(searchAirports('')).toHaveLength(AIRPORTS.length)
  })
})
