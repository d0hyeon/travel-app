import { describe, expect, it } from 'vitest'
import { FlightStatusKind } from '../flightStatus.types'
import { getShouldNotify, toNotificationText } from '../flightStatusNotify.utils'

const 지연 = { kind: FlightStatusKind.지연, estimatedAt: '2026-09-17T20:00:00+09:00' }
const 없음 = { lastNotifiedKind: null, lastNotifiedEstimatedAt: null }

describe('getShouldNotify', () => {
  it('처음 지연되면 보낸다', () => {
    expect(getShouldNotify(지연, 없음)).toBe(true)
  })

  // 5분마다 도는 cron 이라 이게 참이면 지연이 풀릴 때까지 계속 보낸다.
  it('같은 지연을 이미 보냈으면 다시 보내지 않는다', () => {
    expect(
      getShouldNotify(지연, {
        lastNotifiedKind: 'delayed',
        lastNotifiedEstimatedAt: '2026-09-17T20:00:00+09:00',
      }),
    ).toBe(false)
  })

  it('지연 시각이 또 밀리면 다시 보낸다', () => {
    expect(
      getShouldNotify(지연, {
        lastNotifiedKind: 'delayed',
        lastNotifiedEstimatedAt: '2026-09-17T19:50:00+09:00',
      }),
    ).toBe(true)
  })

  it('지연이던 편이 결항되면 보낸다', () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.결항, estimatedAt: null },
        { lastNotifiedKind: 'delayed', lastNotifiedEstimatedAt: '2026-09-17T20:00:00+09:00' },
      ),
    ).toBe(true)
  })

  it('같은 결항을 또 보내지 않는다', () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.결항, estimatedAt: null },
        { lastNotifiedKind: 'cancelled', lastNotifiedEstimatedAt: null },
      ),
    ).toBe(false)
  })

  it('예정은 알릴 것이 없다', () => {
    expect(getShouldNotify({ kind: FlightStatusKind.예정, estimatedAt: null }, 없음)).toBe(false)
  })

  // 이미 일어난 일이라 알려도 늦다.
  it('출발·도착은 알리지 않는다', () => {
    expect(getShouldNotify({ kind: FlightStatusKind.출발, estimatedAt: null }, 없음)).toBe(false)
    expect(getShouldNotify({ kind: FlightStatusKind.도착, estimatedAt: null }, 없음)).toBe(false)
  })

  // 지연이 풀려 정상으로 돌아와도 "정상화" 알림은 보내지 않는다.
  it('지연이 풀리면 조용히 넘어간다', () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.예정, estimatedAt: null },
        { lastNotifiedKind: 'delayed', lastNotifiedEstimatedAt: '2026-09-17T20:00:00+09:00' },
      ),
    ).toBe(false)
  })
})

describe('getShouldNotify — notifyAlways', () => {
  it('상태와 무관하게 보낸다', () => {
    expect(
      getShouldNotify({ kind: FlightStatusKind.예정, estimatedAt: null }, 없음, {
        notifyAlways: true,
      }),
    ).toBe(true)
  })

  it('이미 보낸 상태여도 또 보낸다', () => {
    expect(
      getShouldNotify(
        지연,
        { lastNotifiedKind: 'delayed', lastNotifiedEstimatedAt: '2026-09-17T20:00:00+09:00' },
        { notifyAlways: true },
      ),
    ).toBe(true)
  })

  it('끄면 원래 규칙을 따른다', () => {
    expect(
      getShouldNotify({ kind: FlightStatusKind.예정, estimatedAt: null }, 없음, {
        notifyAlways: false,
      }),
    ).toBe(false)
  })
})

describe('toNotificationText', () => {
  it('지연은 변경된 출발 시각을 말한다', () => {
    const { title, body } = toNotificationText('대한항공 011', 지연)

    expect(title).toBe('대한항공 011편 지연')
    expect(body).toContain('20:00')
  })

  it('결항은 시각을 말하지 않는다', () => {
    const { title, body } = toNotificationText('대한항공 011', {
      kind: FlightStatusKind.결항,
      estimatedAt: null,
    })

    expect(title).toBe('대한항공 011편 결항')
    expect(body).not.toContain(':')
  })

  it('회항을 알린다', () => {
    expect(
      toNotificationText('대한항공 011', { kind: FlightStatusKind.회항, estimatedAt: null }).title,
    ).toBe('대한항공 011편 회항')
  })

  it('정상 운항편도 문구를 갖는다', () => {
    const { title, body } = toNotificationText('대한항공 011', {
      kind: FlightStatusKind.예정,
      estimatedAt: null,
    })

    expect(title).toBe('대한항공 011편 정상 운항 예정')
    expect(body).toContain('정상 운항 예정')
  })

  it('지연인데 변경 시각이 없으면 시각을 지어내지 않는다', () => {
    const { body } = toNotificationText('대한항공 011', {
      kind: FlightStatusKind.지연,
      estimatedAt: null,
    })

    expect(body).toBe('항공편이 지연됐어요.')
  })
})
