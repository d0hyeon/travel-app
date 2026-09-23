import { describe, expect, it } from 'vitest'
import { searchAirports } from '../airport.utils'
import type { Airport } from '../airport.types'

const AIRPORTS: Airport[] = [
  { code: 'ICN', nameKo: '인천국제공항', nameEn: 'Incheon International Airport', cityKo: '서울', timezone: 'Asia/Seoul' },
  { code: 'KIX', nameKo: '간사이국제공항', nameEn: 'Kansai International Airport', cityKo: '오사카', timezone: 'Asia/Tokyo', aliases: ['교토', '고베'] },
  { code: 'PUS', nameKo: '김해국제공항', nameEn: 'Gimhae International Airport', cityKo: '부산', timezone: 'Asia/Seoul', aliases: ['부산'] },
]

describe('searchAirports', () => {
  it('정식 명칭으로 찾는다', () => {
    const codes = searchAirports(AIRPORTS, '인천국제공항').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('"공항"을 뺀 통칭으로도 찾는다', () => {
    const codes = searchAirports(AIRPORTS, '인천공항').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('도시 이름으로 찾는다', () => {
    const codes = searchAirports(AIRPORTS, '오사카').map((a) => a.code)
    expect(codes).toContain('KIX')
  })

  it('IATA 코드로 찾는다', () => {
    const codes = searchAirports(AIRPORTS, 'icn').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('영문명으로 찾는다', () => {
    const codes = searchAirports(AIRPORTS, 'incheon').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('aliases 로 찾는다', () => {
    const codes = searchAirports(AIRPORTS, '부산').map((a) => a.code)
    expect(codes).toContain('PUS')
  })

  it('공백은 무시한다', () => {
    const codes = searchAirports(AIRPORTS, '인천 공항').map((a) => a.code)
    expect(codes).toContain('ICN')
  })

  it('빈 키워드는 전체를 돌려준다', () => {
    expect(searchAirports(AIRPORTS, '')).toHaveLength(AIRPORTS.length)
  })
})
