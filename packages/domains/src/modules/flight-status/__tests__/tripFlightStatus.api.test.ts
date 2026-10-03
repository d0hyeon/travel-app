import { describe, expect, it } from 'vitest'
import { FlightStatusKind } from '../flightStatus.types'
import { toFlightStatusFromRow, type TripFlightStatusRow } from '../tripFlightStatus.api'

const row: TripFlightStatusRow = {
  transport_id: 'transport-1',
  kind: 'delayed',
  scheduled_at: '2026-10-05T01:00:00+00:00',
  estimated_at: '2026-10-05T01:40:00+00:00',
  gate: '23',
  terminal: 'P03',
  arrival_scheduled_at: null,
  arrival_estimated_at: null,
}

describe('toFlightStatusFromRow', () => {
  it('행의 kind 를 운항 상태 종류로 바꾼다', () => {
    expect(toFlightStatusFromRow(row)?.kind).toBe(FlightStatusKind.지연)
  })

  it('모르는 kind 는 예정으로 둔다', () => {
    expect(toFlightStatusFromRow({ ...row, kind: 'unknown' })?.kind).toBe(FlightStatusKind.예정)
  })

  it('예정·변경 시각과 게이트를 그대로 옮긴다', () => {
    expect(toFlightStatusFromRow(row)).toMatchObject({
      scheduledAt: '2026-10-05T01:00:00+00:00',
      estimatedAt: '2026-10-05T01:40:00+00:00',
      gate: '23',
    })
  })

  it('터미널 코드를 라벨로 바꾼다', () => {
    expect(toFlightStatusFromRow(row)?.terminal).toBe('2터미널')
  })

  it('모르는 터미널 코드는 비운다', () => {
    expect(toFlightStatusFromRow({ ...row, terminal: 'P09' })?.terminal).toBeUndefined()
  })

  it('행의 도착 예정·변경 시각을 운항 상태로 옮긴다', () => {
    const status = toFlightStatusFromRow({
      ...row,
      arrival_scheduled_at: '2026-10-05T02:15:00+00:00',
      arrival_estimated_at: '2026-10-05T02:30:00+00:00',
    })

    expect(status?.arrivalScheduledAt).toBe('2026-10-05T02:15:00+00:00')
    expect(status?.arrivalEstimatedAt).toBe('2026-10-05T02:30:00+00:00')
  })

  it('도착 시각이 없으면 비운다', () => {
    const status = toFlightStatusFromRow(row)

    expect(status?.arrivalScheduledAt).toBeUndefined()
    expect(status?.arrivalEstimatedAt).toBeUndefined()
  })

  it('게이트가 빈 문자열이면 비운다', () => {
    expect(toFlightStatusFromRow({ ...row, gate: '' })?.gate).toBeUndefined()
  })

  it('게이트가 빈 문자열이면 비운다', () => {
    expect(toFlightStatusFromRow({ ...row, gate: '' })?.gate).toBeUndefined()
  })

  it('터미널과 게이트가 없으면 비운다', () => {
    const status = toFlightStatusFromRow({ ...row, terminal: null, gate: null })

    expect(status?.terminal).toBeUndefined()
    expect(status?.gate).toBeUndefined()
  })

  it('변경 시각이 예정 시각과 같으면 변경 시각을 비운다', () => {
    const status = toFlightStatusFromRow({ ...row, estimated_at: '2026-10-05T10:00:00+09:00' })

    expect(status?.estimatedAt).toBeUndefined()
  })

  it('예정 시각이 없는 행은 상태로 보지 않는다', () => {
    expect(toFlightStatusFromRow({ ...row, scheduled_at: null })).toBeNull()
  })
})
