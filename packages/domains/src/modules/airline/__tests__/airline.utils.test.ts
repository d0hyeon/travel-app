import { describe, expect, it } from 'vitest'
import { AIRLINES } from '../airline.data'
import { findAirline, searchAirlines } from '../airline.utils'

describe('findAirline', () => {
  it('코드로 항공사를 찾는다', () => {
    expect(findAirline('KE')?.nameKo).toBe('대한항공')
  })

  it('없는 코드는 undefined 를 돌려준다', () => {
    expect(findAirline('ZZ')).toBeUndefined()
  })
})

describe('searchAirlines', () => {
  it('한글 이름으로 찾는다', () => {
    const codes = searchAirlines('대한항공').map((a) => a.code)
    expect(codes).toContain('KE')
  })

  it('이름 일부로 찾는다', () => {
    const codes = searchAirlines('대한').map((a) => a.code)
    expect(codes).toContain('KE')
  })

  it('IATA 코드로 찾는다', () => {
    const codes = searchAirlines('ke').map((a) => a.code)
    expect(codes).toContain('KE')
  })

  it('영문명으로 찾는다', () => {
    const codes = searchAirlines('korean').map((a) => a.code)
    expect(codes).toContain('KE')
  })

  it('공백은 무시한다', () => {
    const codes = searchAirlines('대한 항공').map((a) => a.code)
    expect(codes).toContain('KE')
  })

  it('빈 키워드는 전체를 돌려준다', () => {
    expect(searchAirlines('')).toHaveLength(AIRLINES.length)
  })
})
