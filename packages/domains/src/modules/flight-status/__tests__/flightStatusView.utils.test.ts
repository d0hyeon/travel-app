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

    expect(view.tone).toBe('warning')
    expect(view.title).toBe('20분 지연')
    expect(view.description).toContain('19:40')
    expect(view.description).toContain('20:00')
  })

  it('한 시간을 넘긴 지연은 시간으로 읽는다', () => {
    const view = toFlightStatusView({
      kind: FlightStatusKind.지연,
      scheduledAt: '2026-09-17T19:00:00+09:00',
      estimatedAt: '2026-09-17T21:45:00+09:00',
    })

    expect(view.title).toBe('2시간 45분 지연')
  })

  it('결항은 변경 시각을 말하지 않는다', () => {
    const view = toFlightStatusView({ kind: FlightStatusKind.결항, scheduledAt })

    expect(view.tone).toBe('error')
    expect(view.title).toBe('결항')
    expect(view.description).toBeUndefined()
  })

  it('회항을 알린다', () => {
    const view = toFlightStatusView({ kind: FlightStatusKind.회항, scheduledAt })

    expect(view.tone).toBe('error')
    expect(view.title).toBe('회항')
  })

  it('예정은 정상으로 보이고 예정 시각을 말한다', () => {
    const view = toFlightStatusView({ kind: FlightStatusKind.예정, scheduledAt })

    expect(view.tone).toBe('normal')
    expect(view.title).toBe('정상 운항 예정')
    expect(view.description).toContain('19:40')
  })

  it('출발·도착은 완료로 보인다', () => {
    expect(toFlightStatusView({ kind: FlightStatusKind.출발, scheduledAt }).tone).toBe('done')
    expect(toFlightStatusView({ kind: FlightStatusKind.도착, scheduledAt }).title).toBe('도착')
  })

  // 지연으로 왔는데 변경 시각이 없으면 분을 셀 수 없다.
  it('지연인데 변경 시각이 없으면 분을 만들어내지 않는다', () => {
    const view = toFlightStatusView({ kind: FlightStatusKind.지연, scheduledAt })

    expect(view.title).toBe('지연')
    expect(view.tone).toBe('warning')
  })

  // 예정 시각보다 앞당겨지는 편이 실제로 있다(KE647Y).
  it('앞당겨지면 지연으로 읽지 않는다', () => {
    const view = toFlightStatusView({
      kind: FlightStatusKind.지연,
      scheduledAt: '2026-09-17T00:05:00+09:00',
      estimatedAt: '2026-09-16T23:42:00+09:00',
    })

    expect(view.title).toBe('지연')
  })

  it('상태가 없으면 아무것도 보여주지 않는다', () => {
    expect(toFlightStatusView(null)).toBeNull()
  })
})
