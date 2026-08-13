import { describe, expect, it } from 'vitest'
import { toTourismVisitorItems } from '../tourismTrend.api'

describe('toTourismVisitorItems', () => {
  it('locgo 응답의 signguCode를 지역코드로 읽는다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [
          {
            signguCode: '51150',
            signguNm: '강릉시',
            daywkDivCd: '2',
            daywkDivNm: '화요일',
            touDivCd: '2',
            touDivNm: '외지인(b)',
            touNum: '353307.5',
            baseYmd: '20250701',
          },
        ],
      },
    })

    expect(result).toEqual([
      { regionCode: '51150', visitorDivision: '2', visitorCount: 353307.5 },
    ])
  })

  it('metco 응답의 areaCode를 지역코드로 읽는다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [
          {
            areaCode: '11',
            areaNm: '서울특별시',
            daywkDivCd: '2',
            touDivCd: '3',
            touNum: '24391.06',
            baseYmd: '20250701',
          },
        ],
      },
    })

    expect(result).toEqual([
      { regionCode: '11', visitorDivision: '3', visitorCount: 24391.06 },
    ])
  })

  it('item이 단일 객체여도 배열로 정규화한다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: {
          signguCode: '51150',
          touDivCd: '2',
          touNum: '100',
          baseYmd: '20250701',
        },
      },
    })

    expect(result).toHaveLength(1)
    expect(result[0].regionCode).toBe('51150')
  })

  it('items가 없으면 빈 배열을 반환한다', () => {
    expect(toTourismVisitorItems({})).toEqual([])
  })

  it('touNum이 숫자로 변환되지 않는 레코드는 건너뛴다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [
          { signguCode: '51150', touDivCd: '2', touNum: '', baseYmd: '20250701' },
          { signguCode: '51830', touDivCd: '2', touNum: '70', baseYmd: '20250701' },
        ],
      },
    })

    expect(result).toEqual([
      { regionCode: '51830', visitorDivision: '2', visitorCount: 70 },
    ])
  })

  it('지역코드가 없는 레코드는 건너뛴다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [{ touDivCd: '2', touNum: '70', baseYmd: '20250701' }],
      },
    })

    expect(result).toEqual([])
  })
})
