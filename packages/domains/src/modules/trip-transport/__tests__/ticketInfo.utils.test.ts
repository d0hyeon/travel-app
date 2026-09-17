import { describe, expect, it } from 'vitest'
import { extractTicketInfo } from '../ticketInfo.utils'

// 실제 탑승권을 Google Vision 에 넣어 얻은 텍스트다. 지어낸 형식이 아니다.
// 라벨과 값이 붙어 있지 않다는 것이 이 데이터의 핵심이다.
const ANA = `ANA
TOKYO (HANEDA)
HND
FLIGHT
GATE
BOARDING
SEAT
NH0218 109 10:05
(Z)1A
PASSENGER
DATE
10FEB
AMSTERDAM
AMS
GROUP
GROUP1
TERMINAL
NH
HANZAKI/YOSHITO MR 3`

const VIETNAM = `Vietnam Airlines
CHUYẾN BAY IFLIGHT
VN 236
N
27JUL
CỦA IGATE
GIỜ LÊN MÁY BAY / BOARDING TIME
07/11 09:50 VN 236
GHE/SEAT
22G
SEQ. NO.: 028`

const AIR_COMPANY = `Air Company
BOARDING PASS
Flight No:
AC 2505
GATE
H22
BOA 2017 Y
07:45
Seat:
5A
ETKT 555 1234567890
Seat:
5A
GATE
H22
10/12/2017
BOARDING TIME
07:45`

const KOREAN_AIR_MOBILE = `GMP
CJU
탑승시각
출발시각
탑승구
07:10
07:30
미확정
좌석번호
클래스
터미널
55B
일반석
국내선
탑승 순서 ZONE 2`

const KOREAN_AIR_PAPER = `ECONOMY
탑승권
KOREAN AIR
FLIGHT
KE 901
TO CDG PARIS
DEP TIME
12:10
BOARDING
11:30
GATE
탑승구
233
ZONE 2`

describe('extractTicketInfo', () => {
  it('라벨과 값이 떨어져 있어도 좌석을 읽는다', () => {
    expect(extractTicketInfo(ANA).seat).toBe('1A')
  })

  it('좌석 앞에 붙은 구역 표기를 버린다', () => {
    expect(extractTicketInfo('SEAT\n(Z)1A').seat).toBe('1A')
  })

  it('라벨이 깨져도 좌석 형식으로 찾아낸다', () => {
    expect(extractTicketInfo(VIETNAM).seat).toBe('22G')
  })

  it('반쪽이 둘인 탑승권의 중복 좌석을 하나로 본다', () => {
    expect(extractTicketInfo(AIR_COMPANY).seat).toBe('5A')
  })

  it('한글 라벨 탑승권의 좌석을 읽는다', () => {
    expect(extractTicketInfo(KOREAN_AIR_MOBILE).seat).toBe('55B')
  })

  it('게이트·시각·편명을 좌석으로 오인하지 않는다', () => {
    expect(extractTicketInfo(KOREAN_AIR_PAPER).seat).toBeUndefined()
  })

  it('좌석이 서로 다르게 두 개 잡히면 비운다', () => {
    expect(extractTicketInfo('SEAT 12A\nSEAT 34B').seat).toBeUndefined()
  })

  it('빈 텍스트에서 좌석이 비어 있다', () => {
    expect(extractTicketInfo('').seat).toBeUndefined()
  })
})
