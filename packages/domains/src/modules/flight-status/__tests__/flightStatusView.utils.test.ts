import { describe, expect, it } from 'vitest'
import { FlightStatusKind } from '../flightStatus.types'
import { toFlightStatusView } from '../flightStatusView.utils'

const scheduledAt = '2026-09-17T19:40:00+09:00'

describe('toFlightStatusView', () => {
  it('지연은 변경된 시각과 지연 분을 함께 알린다', () => {
    const view = toFlightStatusView({
      kind: FlightStatusKind.지연,
      scheduledAt,
      estimatedAt: '2026-09-17T20:00:00+09:00',
    })

    expect(view?.tone).toBe('warning')
    expect(view?.title).toBe('항공편이 20분 지연됐어요')
    expect(view?.timeChange).toEqual({ fromClock: '19:40', toClock: '20:00' })
  })

  it('한 시간을 넘긴 지연은 시간으로 읽는다', () => {
    const view = toFlightStatusView({
      kind: FlightStatusKind.지연,
      scheduledAt: '2026-09-17T19:00:00+09:00',
      estimatedAt: '2026-09-17T21:45:00+09:00',
    })

    expect(view?.title).toBe('항공편이 2시간 45분 지연됐어요')
  })

  it('결항은 출발 예정 시각과 함께 안내한다', () => {
    const view = toFlightStatusView({ kind: FlightStatusKind.결항, scheduledAt })

    expect(view?.tone).toBe('error')
    expect(view?.title).toBe('항공편이 결항됐어요')
    expect(view?.description).toContain('19:40')
  })

  it('회항을 알린다', () => {
    const view = toFlightStatusView({ kind: FlightStatusKind.회항, scheduledAt })

    expect(view?.tone).toBe('error')
    expect(view?.title).toBe('도착지가 변경됐어요')
    expect(view?.description).toBeDefined()
  })

  it('탑승구가 바뀐 예정편은 이전 → 변경 탑승구를 대조한다', () => {
    const view = toFlightStatusView(
      { kind: FlightStatusKind.예정, scheduledAt, gate: '41' },
      { gate: '41', prevGate: '23' },
    )

    expect(view?.tone).toBe('normal')
    expect(view?.title).toBe('탑승구가 변경 됐어요')
    expect(view?.gateChange).toEqual({ fromGate: '23', toGate: '41' })
  })

  // 화면에 실을 변경은 지연·결항·회항·탑승구 변경 네 가지뿐이다.
  it('탑승구가 바뀌지 않았으면 알릴 변경이 없어 카드를 만들지 않는다', () => {
    expect(
      toFlightStatusView(
        { kind: FlightStatusKind.예정, scheduledAt, gate: '41' },
        { gate: '41', prevGate: '41' },
      ),
    ).toBeNull()
  })

  it('이전 탑승구를 모르면 대조할 수 없어 카드를 만들지 않는다', () => {
    expect(toFlightStatusView({ kind: FlightStatusKind.예정, scheduledAt, gate: '41' })).toBeNull()
  })

  it('이전 탑승구가 빈 문자열이면 대조할 수 없어 카드를 만들지 않는다', () => {
    expect(
      toFlightStatusView(
        { kind: FlightStatusKind.예정, scheduledAt, gate: '241' },
        { gate: '241', prevGate: '' },
      ),
    ).toBeNull()
  })

  it('탑승구가 빈 문자열이면 대조할 수 없어 카드를 만들지 않는다', () => {
    expect(
      toFlightStatusView(
        { kind: FlightStatusKind.예정, scheduledAt },
        { gate: '', prevGate: '23' },
      ),
    ).toBeNull()
  })

  it('이전 탑승구가 빈 문자열이면 대조할 수 없어 카드를 만들지 않는다', () => {
    expect(
      toFlightStatusView(
        { kind: FlightStatusKind.예정, scheduledAt, gate: '241' },
        { gate: '241', prevGate: '' },
      ),
    ).toBeNull()
  })

  it('탑승구가 빈 문자열이면 대조할 수 없어 카드를 만들지 않는다', () => {
    expect(
      toFlightStatusView(
        { kind: FlightStatusKind.예정, scheduledAt },
        { gate: '', prevGate: '23' },
      ),
    ).toBeNull()
  })

  it('출발·도착은 알릴 변경이 없어 카드를 만들지 않는다', () => {
    expect(toFlightStatusView({ kind: FlightStatusKind.출발, scheduledAt })).toBeNull()
    expect(toFlightStatusView({ kind: FlightStatusKind.도착, scheduledAt })).toBeNull()
  })

  // 지연으로 왔는데 변경 시각이 없으면 분을 셀 수 없다 -- 알릴 변경이 아니다.
  it('지연인데 변경 시각이 없으면 카드를 만들지 않는다', () => {
    expect(toFlightStatusView({ kind: FlightStatusKind.지연, scheduledAt })).toBeNull()
  })

  // 예정 시각보다 앞당겨지는 편이 실제로 있다(KE647Y).
  it('앞당겨지면 지연으로 읽지 않는다', () => {
    const view = toFlightStatusView({
      kind: FlightStatusKind.지연,
      scheduledAt: '2026-09-17T00:05:00+09:00',
      estimatedAt: '2026-09-16T23:42:00+09:00',
    })

    expect(view).toBeNull()
  })

  it('상태가 없으면 아무것도 보여주지 않는다', () => {
    expect(toFlightStatusView(null)).toBeNull()
  })
})
