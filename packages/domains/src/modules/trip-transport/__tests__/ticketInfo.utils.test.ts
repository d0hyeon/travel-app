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

const KOREAN_AIR_SFO = `KOREAN AIR
DL7891 20AUG19 TO SFO SAN FRANCISCO
OPERATED BY KE 025
DEP TIME
19:30
GATE
258
SEAT
28A
FROM SEOUL INCHEON
KE 273`

const ASIANA_PAPER = `ASIANA AIRLINES
BUSINESS
FLIGHT NO. 편명 航班
OZ132 /21MAY16
FROM 출발지 出發地
ICN
TO 목적지 目的地
FUK
BOARDING TIME 탑승시각 登机时间
08:30
GATE 탑승구 登机口
35
SEAT NO. 좌석번호 座位号
WINDOW
AISLE
2K
C
**BUSINESS LOUNGE INVITED**
ETKT
025/ICNKG61/002K/J`

const ASIANA_MOBILE = `Asiana Airlines Boarding Pass
ASIANA AIRLINES
탑승시각
10:15
ICN
CDG
편명
출발시각
좌석
탑승구
OZ501
22SEP23 10:45
12J
이름
클래스
멤버쉽
ECONOMY
-
OZ501/12J/134`

const TWAY_MOBILE = `t'way ECONOMY
좌석
3C
GMP
CJU
편명
출발날짜
출발시각
탑승시각
SEQ
TW729
10/29
18:40
18:20
17
이름
터미널
게이트
SSR
-
-
-`

const TWAY_PAPER = `t'way
BOARDING PASS 탑승권
NAME
LEE/HWANJU MR
FLIGHT
TW122
28OCT
SGN-ICN
DEP TIME 22:35
BOARDING TIME
22:05
GATE
15
SEAT
18B
ETKT:
7222411376610`

// 한 장에 두 구간이 인쇄된다. 어느 구간의 값인지 정할 수 없다.
const AIR_FRANCE_TWO_LEGS = `SKY PRIORITY
AF 077
LOS ANGELES
PARIS
LAX
CDG
Terminal B
Embarquement
20:15
Porte/Gate 148
Zone 2
Siege /Seat
19A
Terminal 2E
AF 1022
PARIS
MUNICH
CDG
MUC
Terminal 2F
Embarquement
17:45
Porte/Gate --
Zone 2
Siege /Seat
4A
Terminal 1`

const QATAR = `oneworld
QATAR
Boarding Pass
Economy Class
Name of the Passenger
Departure
1725
Date
12FEB
HAN-BKK
25K
ZONE 3
QR835
12FEB
ETKT 1572367248844-1
Boarding
1625
Gate
32
Seat
25K
ZONE 3
SEQ-185
Flight
QR
835`

const CATHAY = `CATHAY PACIFIC
ECONOMY
BOARDING TIME
GATE
SEAT
09:40
48
DEPARTURE
TERMINAL
DATE
10:10
1
09 DEC
FLIGHT
CX417
ROUTE
ICN > HKG
GATE
48
PLEASE BE AT THE BOARDING GATE 30 MINS PRIOR TO DEPARTURE. GATE CLOSES 10 MINS BEFORE.
oneworld`

describe('extractTicketInfo', () => {
  it('라벨 넷이 먼저 묶여 나와도 세 값을 읽는다', () => {
    expect(extractTicketInfo(ANA)).toEqual({ seat: '1A', gate: '109', terminal: '3' })
  })

  it('좌석 앞에 붙은 구역 표기를 버린다', () => {
    expect(extractTicketInfo('SEAT\n(Z)1A').seat).toBe('1A')
  })

  it('반쪽이 둘인 탑승권의 중복 값을 하나로 본다', () => {
    expect(extractTicketInfo(AIR_COMPANY)).toMatchObject({ seat: '5A', gate: 'H22' })
  })

  it('한글 라벨 탑승권을 읽는다', () => {
    expect(extractTicketInfo(KOREAN_AIR_MOBILE)).toEqual({
      seat: '55B',
      gate: undefined,
      terminal: '국내선',
    })
  })

  it('게이트만 있는 탑승권에서 시각·편명을 좌석으로 오인하지 않는다', () => {
    expect(extractTicketInfo(KOREAN_AIR_PAPER)).toEqual({
      seat: undefined,
      gate: '233',
      terminal: undefined,
    })
  })

  it('코드셰어 표기가 섞여도 좌석과 게이트를 읽는다', () => {
    expect(extractTicketInfo(KOREAN_AIR_SFO)).toMatchObject({ seat: '28A', gate: '258' })
  })

  it('e-티켓 번호의 조각을 좌석으로 오인하지 않는다', () => {
    expect(extractTicketInfo(ASIANA_PAPER)).toMatchObject({ seat: '2K', gate: '35' })
  })

  it('탑승구가 비어 있으면 게이트를 비운다', () => {
    expect(extractTicketInfo(ASIANA_MOBILE)).toEqual({
      seat: '12J',
      gate: undefined,
      terminal: undefined,
    })
  })

  it('값이 하이픈인 필드를 비운다', () => {
    expect(extractTicketInfo(TWAY_MOBILE)).toEqual({
      seat: '3C',
      gate: undefined,
      terminal: undefined,
    })
  })

  it('라벨과 값이 한 줄에 붙은 탑승권을 읽는다', () => {
    expect(extractTicketInfo(TWAY_PAPER)).toMatchObject({ seat: '18B', gate: '15' })
  })

  it('한 장에 두 구간이 있으면 세 값을 모두 비운다', () => {
    expect(extractTicketInfo(AIR_FRANCE_TWO_LEGS)).toEqual({
      seat: undefined,
      gate: undefined,
      terminal: undefined,
    })
  })

  it('아랍어가 병기된 탑승권을 읽는다', () => {
    expect(extractTicketInfo(QATAR)).toMatchObject({ seat: '25K', gate: '32' })
  })

  it('"GATE CLOSES" 안내 문구를 라벨로 보지 않는다', () => {
    expect(extractTicketInfo(CATHAY)).toMatchObject({ gate: '48', terminal: '1' })
  })

  it('좌석이 서로 다르게 두 개 잡히면 비운다', () => {
    expect(extractTicketInfo('SEAT 12A\nSEAT 34B').seat).toBeUndefined()
  })

  it('빈 텍스트에서 세 값이 모두 비어 있다', () => {
    expect(extractTicketInfo('')).toEqual({
      seat: undefined,
      gate: undefined,
      terminal: undefined,
    })
  })
})
