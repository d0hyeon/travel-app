import { describe, expect, it } from 'vitest'
import {
  getIsSameKstDate,
  isSameFlight,
  toFlightStatusKind,
  toIsoFromApiDateTime,
} from '../incheonFlightStatus.utils'

describe('isSameFlight', () => {
  it('편명이 그대로 일치하면 같은 편이다', () => {
    expect(isSameFlight('KE1405', { airlineCode: 'KE', flightNumber: '1405' })).toBe(true)
  })

  it('편번호의 제로패딩을 무시한다', () => {
    expect(isSameFlight('KE011', { airlineCode: 'KE', flightNumber: '11' })).toBe(true)
  })

  it('사용자가 제로패딩을 넣어도 찾는다', () => {
    expect(isSameFlight('KE11', { airlineCode: 'KE', flightNumber: '011' })).toBe(true)
  })

  it('편명 접미 문자를 무시한다', () => {
    expect(isSameFlight('KE647Y', { airlineCode: 'KE', flightNumber: '647' })).toBe(true)
  })

  it('항공사가 다르면 다른 편이다', () => {
    expect(isSameFlight('OZ1405', { airlineCode: 'KE', flightNumber: '1405' })).toBe(false)
  })

  it('편번호가 다르면 다른 편이다', () => {
    expect(isSameFlight('KE1405', { airlineCode: 'KE', flightNumber: '1406' })).toBe(false)
  })

  it('편번호가 접두로만 겹치면 다른 편이다', () => {
    expect(isSameFlight('KE1405', { airlineCode: 'KE', flightNumber: '140' })).toBe(false)
  })

  it('항공사 코드의 대소문자를 가리지 않는다', () => {
    expect(isSameFlight('KE1405', { airlineCode: 'ke', flightNumber: '1405' })).toBe(true)
  })

  it('편번호 앞뒤 공백을 무시한다', () => {
    expect(isSameFlight('KE1405', { airlineCode: 'KE', flightNumber: ' 1405 ' })).toBe(true)
  })
})

describe('toFlightStatusKind', () => {
  it('지연을 알아본다', () => {
    expect(toFlightStatusKind('지연')).toBe('delayed')
  })

  it('결항을 알아본다', () => {
    expect(toFlightStatusKind('결항')).toBe('cancelled')
  })

  it('회항을 알아본다', () => {
    expect(toFlightStatusKind('회항')).toBe('diverted')
  })

  it('출발을 알아본다', () => {
    expect(toFlightStatusKind('출발')).toBe('departed')
  })

  it('도착을 알아본다', () => {
    expect(toFlightStatusKind('도착')).toBe('arrived')
  })

  // 미래편은 remark 가 비어 온다. 전체 응답의 92% 가 이 경우다.
  it('상태가 없으면 예정이다', () => {
    expect(toFlightStatusKind(undefined)).toBe('scheduled')
    expect(toFlightStatusKind('')).toBe('scheduled')
  })

  // 탑승준비·탑승중·마감예정처럼 알림 대상이 아닌 진행 상태가 더 있다.
  it('모르는 상태는 예정으로 둔다', () => {
    expect(toFlightStatusKind('탑승준비')).toBe('scheduled')
  })
})

describe('toIsoFromApiDateTime', () => {
  it('YYYYMMDDHHMM 을 KST 기준 ISO 로 바꾼다', () => {
    expect(toIsoFromApiDateTime('202609171355')).toBe('2026-09-17T13:55:00+09:00')
  })

  it('자정을 넘긴 시각도 그대로 읽는다', () => {
    expect(toIsoFromApiDateTime('202609170005')).toBe('2026-09-17T00:05:00+09:00')
  })

  it('형식이 어긋나면 undefined 를 돌려준다', () => {
    expect(toIsoFromApiDateTime('1355')).toBeUndefined()
    expect(toIsoFromApiDateTime('')).toBeUndefined()
    expect(toIsoFromApiDateTime(undefined)).toBeUndefined()
  })
})

describe('getIsSameKstDate', () => {
  it('같은 KST 날짜면 참이다', () => {
    expect(
      getIsSameKstDate('2026-09-20T08:00:00+09:00', '2026-09-20T21:30:00+09:00'),
    ).toBe(true)
  })

  it('UTC 로 적힌 시각을 KST 로 옮겨 비교한다', () => {
    expect(
      getIsSameKstDate('2026-09-19T23:00:00+00:00', '2026-09-20T08:00:00+09:00'),
    ).toBe(true)
  })

  it('KST 자정 직후와 직전은 다른 날이다', () => {
    expect(
      getIsSameKstDate('2026-09-20T00:05:00+09:00', '2026-09-19T23:55:00+09:00'),
    ).toBe(false)
  })

  it('오프셋 표기가 서로 달라도 같은 순간이면 같은 날이다', () => {
    expect(
      getIsSameKstDate('2026-09-20T00:30:00+09:00', '2026-09-19T15:30:00Z'),
    ).toBe(true)
  })

  it('날짜가 다르면 거짓이다', () => {
    expect(
      getIsSameKstDate('2026-09-20T08:00:00+09:00', '2026-09-21T08:00:00+09:00'),
    ).toBe(false)
  })

  it('시각을 읽을 수 없으면 거짓이다', () => {
    expect(getIsSameKstDate('언제인지 모름', '2026-09-20T08:00:00+09:00')).toBe(false)
  })
})
