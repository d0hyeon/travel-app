import { describe, expect, it } from 'vitest'
import { extractTicketInfo } from '../ticketInfo.utils'

describe('extractTicketInfo', () => {
  it('좌석 라벨 뒤의 값을 좌석으로 읽는다', () => {
    const text = 'KOREAN AIR\nSEAT 32A\nICN → KIX'

    expect(extractTicketInfo(text).seat).toBe('32A')
  })

  it('터미널 표기가 "제2여객터미널" 이어도 "2" 로 읽는다', () => {
    expect(extractTicketInfo('제2여객터미널').terminal).toBe('2')
    expect(extractTicketInfo('TERMINAL T2').terminal).toBe('2')
  })

  it('게이트가 영문자를 포함해도 그대로 읽는다', () => {
    expect(extractTicketInfo('GATE 27A').gate).toBe('27A')
  })

  it('라벨이 없으면 해당 값을 비운다', () => {
    const info = extractTicketInfo('SEAT 32A')

    expect(info.seat).toBe('32A')
    expect(info.gate).toBeUndefined()
    expect(info.terminal).toBeUndefined()
  })

  it('같은 라벨이 여러 번 나오면 값을 비운다', () => {
    expect(extractTicketInfo('GATE 27\nGATE 31').gate).toBeUndefined()
  })

  it('빈 텍스트에서 세 값이 모두 비어 있다', () => {
    expect(extractTicketInfo('')).toEqual({
      seat: undefined,
      terminal: undefined,
      gate: undefined,
    })
  })
})
