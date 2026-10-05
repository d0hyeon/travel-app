import { describe, expect, it } from 'vitest'
import { toFlightGateChange } from '../flightGateChange.api'

describe('toFlightGateChange', () => {
  it('탑승구와 이전 탑승구를 그대로 옮긴다', () => {
    expect(toFlightGateChange({ gate: '41', prev_gate: '23' })).toEqual({ gate: '41', prevGate: '23' })
  })

  it('빈 문자열은 값이 없는 것으로 본다', () => {
    expect(toFlightGateChange({ gate: '241', prev_gate: '' })).toEqual({ gate: '241', prevGate: null })
  })

  it('공백뿐인 값도 값이 없는 것으로 본다', () => {
    expect(toFlightGateChange({ gate: ' ', prev_gate: ' ' })).toEqual({ gate: null, prevGate: null })
  })

  it('null 은 그대로 null 이다', () => {
    expect(toFlightGateChange({ gate: null, prev_gate: null })).toEqual({ gate: null, prevGate: null })
  })
})
