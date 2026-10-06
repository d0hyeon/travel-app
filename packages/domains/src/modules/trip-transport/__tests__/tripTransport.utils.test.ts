import { describe, expect, it } from 'vitest'
import {
  applyFlightStatus,
  findMyTicket,
  getCarrierInfo,
  getOperationalFields,
  getTicketStoragePath,
  isOvernightArrival,
  groupByDepartureDate,
  splitByDeparture,
} from '../tripTransport.utils'
import { FlightStatusKind, type FlightStatus } from '../../flight-status'
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

describe('getOperationalFields', () => {
  it('항공은 터미널·게이트·좌석을 보여준다', () => {
    expect(getOperationalFields('flight')).toEqual([
      { name: 'terminal', label: '터미널' },
      { name: 'gate', label: '게이트' },
      { name: 'seat', label: '좌석(나)' },
    ])
  })

  it('기차는 게이트가 없고 터미널을 플랫폼으로 부른다', () => {
    expect(getOperationalFields('train')).toEqual([
      { name: 'terminal', label: '플랫폼' },
      { name: 'seat', label: '좌석(나)' },
    ])
  })

  it('버스도 기차와 같다', () => {
    expect(getOperationalFields('bus')).toEqual(getOperationalFields('train'))
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

  it('기차·버스는 읽을 운항 정보가 없다', () => {
    const 기차편: TripTransport = {
      ...createTransport('t1', '2026-03-01T09:10:00Z'),
      type: 'train',
    }

    expect(getCarrierInfo(기차편)).toEqual({ name: undefined, number: undefined })
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

describe('getTicketStoragePath', () => {
  it('공개 URL 에서 R2 키를 뽑는다', () => {
    expect(
      getTicketStoragePath('https://cdn.waylog.me/trip-transport-tickets/t1/abc.webp'),
    ).toBe('trip-transport-tickets/t1/abc.webp')
  })

  it('공개 URL 에 경로 접두가 있어도 티켓 키부터 뽑는다', () => {
    expect(
      getTicketStoragePath('https://example.r2.dev/waylog/trip-transport-tickets/t1/abc.jpg'),
    ).toBe('trip-transport-tickets/t1/abc.jpg')
  })

  it('쿼리스트링은 키에 포함하지 않는다', () => {
    expect(
      getTicketStoragePath('https://cdn.waylog.me/trip-transport-tickets/t1/abc.webp?v=1'),
    ).toBe('trip-transport-tickets/t1/abc.webp')
  })

  it('티켓 경로가 아니면 undefined 를 돌려 다른 파일을 지우지 않는다', () => {
    expect(getTicketStoragePath('https://cdn.waylog.me/user-avatars/u1/abc.webp')).toBeUndefined()
  })
})

describe('applyFlightStatus', () => {
  const transport: TripTransport = {
    ...createTransport('transport-1', '2026-10-05T10:00:00+09:00'),
    arrivalAt: '2026-10-05T13:00:00+09:00',
  }

  const delayedStatus: FlightStatus = {
    kind: FlightStatusKind.지연,
    scheduledAt: '2026-10-05T10:00:00+09:00',
    estimatedAt: '2026-10-05T10:40:00+09:00',
  }

  it('운항 상태가 없으면 교통편을 그대로 돌려준다', () => {
    expect(applyFlightStatus(transport, null)).toEqual(transport)
  })

  it('변경 시각이 있으면 출발 시각을 변경 시각으로 바꾼다', () => {
    expect(applyFlightStatus(transport, delayedStatus).departureAt).toBe('2026-10-05T10:40:00+09:00')
  })

  it('변경 시각이 없으면 예정 시각으로 출발 시각을 바꾼다', () => {
    const status: FlightStatus = { kind: FlightStatusKind.예정, scheduledAt: '2026-10-05T10:05:00+09:00' }

    expect(applyFlightStatus(transport, status).departureAt).toBe('2026-10-05T10:05:00+09:00')
  })

  it('API 도착 변경 시각이 있으면 도착 시각으로 쓴다', () => {
    const status: FlightStatus = {
      ...delayedStatus,
      arrivalScheduledAt: '2026-10-05T11:15:00+09:00',
      arrivalEstimatedAt: '2026-10-05T11:30:00+09:00',
    }

    expect(applyFlightStatus(transport, status).arrivalAt).toBe('2026-10-05T11:30:00+09:00')
  })

  it('API 도착 변경 시각이 없으면 예정 도착 시각을 쓴다', () => {
    const status: FlightStatus = { ...delayedStatus, arrivalScheduledAt: '2026-10-05T11:15:00+09:00' }

    expect(applyFlightStatus(transport, status).arrivalAt).toBe('2026-10-05T11:15:00+09:00')
  })

  it('API 도착 시각이 있으면 지연 분을 알리지 않는다', () => {
    const status: FlightStatus = { ...delayedStatus, arrivalEstimatedAt: '2026-10-05T11:30:00+09:00' }

    expect(applyFlightStatus(transport, status).departureDelayMinutes).toBeUndefined()
  })

  it('API 도착 시각이 없고 출발이 지연이면 도착 시각은 그대로 두고 지연 분을 알린다', () => {
    const scheduled = applyFlightStatus(transport, delayedStatus)

    expect(scheduled.arrivalAt).toBe(transport.arrivalAt)
    expect(scheduled.departureDelayMinutes).toBe(40)
  })

  it('일찍 출발해도 지연 분을 알리지 않는다', () => {
    const status: FlightStatus = {
      kind: FlightStatusKind.출발,
      scheduledAt: '2026-10-05T10:00:00+09:00',
      estimatedAt: '2026-10-05T09:50:00+09:00',
    }

    expect(applyFlightStatus(transport, status).departureDelayMinutes).toBeUndefined()
  })

  it('결항이면 지연 분을 알리지 않는다', () => {
    const status: FlightStatus = { ...delayedStatus, kind: FlightStatusKind.결항 }

    expect(applyFlightStatus(transport, status).departureDelayMinutes).toBeUndefined()
  })

  it('회항이면 지연 분을 알리지 않는다', () => {
    const status: FlightStatus = { ...delayedStatus, kind: FlightStatusKind.회항 }

    expect(applyFlightStatus(transport, status).departureDelayMinutes).toBeUndefined()
  })

  it('도착 시각이 없는 교통편은 도착 시각을 만들지 않는다', () => {
    const withoutArrival = createTransport('transport-2', '2026-10-05T10:00:00+09:00')
    const scheduled = applyFlightStatus(withoutArrival, delayedStatus)

    expect(scheduled.arrivalAt).toBeUndefined()
    expect(scheduled.departureDelayMinutes).toBeUndefined()
  })

  it('입력 교통편을 수정하지 않는다', () => {
    const before = { ...transport }
    applyFlightStatus(transport, delayedStatus)

    expect(transport).toEqual(before)
  })
})
