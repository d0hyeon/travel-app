import { describe, expect, it } from 'vitest'
import {
  findMyTicket,
  getCarrierInfo,
  isOvernightArrival,
  groupByDepartureDate,
  splitByDeparture,
} from '../tripTransport.utils'
import type { TripTransport, TripTransportTicket } from '../tripTransport.types'

function createTransport(
  id: string,
  departureAt: string,
  tickets: TripTransportTicket[] = [],
): TripTransport {
  return {
    id,
    tripId: 'trip-1',
    type: 'flight',
    departureName: '인천국제공항',
    arrivalName: '간사이국제공항',
    departureAt,
    tickets,
    createdAt: '2026-09-15T00:00:00Z',
  }
}

function createTicket(id: string, memberId?: string): TripTransportTicket {
  return { id, transportId: 't1', memberId, image: `${id}.png`, createdAt: '2026-09-15T00:00:00Z' }
}

describe('splitByDeparture', () => {
  it('출발 시각이 기준보다 앞이면 지난 것이다', () => {
    const 지난편 = createTransport('t1', '2026-03-01T09:10:00Z')
    const 예정편 = createTransport('t2', '2026-03-03T14:20:00Z')

    const { past, upcoming } = splitByDeparture([지난편, 예정편], new Date('2026-03-02T00:00:00Z'))

    expect(past).toEqual([지난편])
    expect(upcoming).toEqual([예정편])
  })

  it('출발 시각이 기준과 같으면 아직 지나지 않았다', () => {
    const 출발중 = createTransport('t1', '2026-03-02T00:00:00Z')

    const { past, upcoming } = splitByDeparture([출발중], new Date('2026-03-02T00:00:00Z'))

    expect(past).toEqual([])
    expect(upcoming).toEqual([출발중])
  })

  it('지난 것은 최근 출발이 앞에 온다', () => {
    const 오래된편 = createTransport('t1', '2026-03-01T09:00:00Z')
    const 최근편 = createTransport('t2', '2026-03-01T18:00:00Z')

    const { past } = splitByDeparture([오래된편, 최근편], new Date('2026-03-02T00:00:00Z'))

    expect(past.map((x) => x.id)).toEqual(['t2', 't1'])
  })

  it('예정된 것은 가까운 출발이 앞에 온다', () => {
    const 나중편 = createTransport('t1', '2026-03-05T09:00:00Z')
    const 곧출발 = createTransport('t2', '2026-03-03T09:00:00Z')

    const { upcoming } = splitByDeparture([나중편, 곧출발], new Date('2026-03-02T00:00:00Z'))

    expect(upcoming.map((x) => x.id)).toEqual(['t2', 't1'])
  })
})

describe('groupByDepartureDate', () => {
  it('같은 날 출발끼리 묶는다', () => {
    const 오전편 = createTransport('t1', '2026-03-01T09:10:00Z')
    const 오후편 = createTransport('t2', '2026-03-01T14:20:00Z')
    const 다음날 = createTransport('t3', '2026-03-02T10:00:00Z')

    const groups = groupByDepartureDate([오전편, 오후편, 다음날], 'UTC')

    expect(groups).toEqual([
      { date: '2026-03-01', transports: [오전편, 오후편] },
      { date: '2026-03-02', transports: [다음날] },
    ])
  })

  it('비어 있으면 그룹도 없다', () => {
    expect(groupByDepartureDate([], 'UTC')).toEqual([])
  })

  it('타임존에 따라 날짜가 갈린다', () => {
    const 한국_자정직전 = createTransport('t1', '2026-03-01T14:00:00Z')

    const seoul = groupByDepartureDate([한국_자정직전], 'Asia/Seoul')

    expect(seoul[0].date).toBe('2026-03-01')
  })
})

describe('findMyTicket', () => {
  it('내 티켓을 찾는다', () => {
    const 내티켓 = createTicket('tk1', 'me')
    const 남의티켓 = createTicket('tk2', 'other')

    expect(findMyTicket([내티켓, 남의티켓], 'me')).toBe(내티켓)
  })

  it('내 티켓이 없으면 공용 티켓을 준다', () => {
    const 공용 = createTicket('tk1', undefined)
    const 남의티켓 = createTicket('tk2', 'other')

    expect(findMyTicket([공용, 남의티켓], 'me')).toBe(공용)
  })

  it('내 티켓과 공용이 모두 있으면 내 것이 먼저다', () => {
    const 공용 = createTicket('tk1', undefined)
    const 내티켓 = createTicket('tk2', 'me')

    expect(findMyTicket([공용, 내티켓], 'me')).toBe(내티켓)
  })

  it('둘 다 없으면 없다', () => {
    const 남의티켓 = createTicket('tk1', 'other')

    expect(findMyTicket([남의티켓], 'me')).toBeUndefined()
  })
})

describe('getCarrierInfo', () => {
  it('항공은 항공사와 편명을 읽는다', () => {
    const 항공편 = {
      ...createTransport('t1', '2026-03-01T09:10:00Z'),
      airline: '대한항공',
      flightNumber: 'KE721',
    }

    expect(getCarrierInfo(항공편)).toEqual({ name: '대한항공', number: 'KE721' })
  })

  it('기차·버스는 사업자와 편성번호를 읽는다', () => {
    const 기차편: TripTransport = {
      ...createTransport('t1', '2026-03-01T09:10:00Z'),
      type: 'train',
      provider: '코레일',
      serviceNumber: 'KTX 101',
    }

    expect(getCarrierInfo(기차편)).toEqual({ name: '코레일', number: 'KTX 101' })
  })

  it('비어 있는 필드는 그대로 비워 낸다', () => {
    const 편명만 = { ...createTransport('t1', '2026-03-01T09:10:00Z'), flightNumber: 'KE721' }

    expect(getCarrierInfo(편명만)).toEqual({ name: undefined, number: 'KE721' })
  })
})

describe('isOvernightArrival', () => {
  it('같은 날 도착이면 아니다', () => {
    const 당일도착 = {
      ...createTransport('t1', '2026-03-01T01:10:00Z'),
      arrivalAt: '2026-03-01T03:45:00Z',
    }

    expect(isOvernightArrival(당일도착)).toBe(false)
  })

  it('날이 넘어가면 맞다', () => {
    const 익일도착: TripTransport = {
      ...createTransport('t1', '2026-03-01T22:10:00Z'),
      arrivalAt: '2026-03-02T03:45:00Z',
      departureTimezone: 'UTC',
      arrivalTimezone: 'UTC',
    }

    expect(isOvernightArrival(익일도착)).toBe(true)
  })

  it('도착 시각이 없으면 아니다', () => {
    expect(isOvernightArrival(createTransport('t1', '2026-03-01T09:10:00Z'))).toBe(false)
  })

  it('UTC로는 같은 날이어도 각 지점 타임존에서 갈리면 맞다', () => {
    const 시차도착: TripTransport = {
      ...createTransport('t1', '2026-03-01T14:10:00Z'),
      arrivalAt: '2026-03-01T16:45:00Z',
      departureTimezone: 'America/Los_Angeles',
      arrivalTimezone: 'Asia/Seoul',
    }

    expect(isOvernightArrival(시차도착)).toBe(true)
  })
})
