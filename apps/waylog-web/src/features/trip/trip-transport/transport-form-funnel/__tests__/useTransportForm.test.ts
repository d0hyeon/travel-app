import { act, renderHook, waitFor } from '@testing-library/react'
import { TransportType } from '@waylog/domains/modules/transport'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWrapper } from '~fixtures/wraper'
import * as photoApi from '~features/photo/photo.api'
import * as ticketInfoApi from '../../../../../../../../packages/domains/src/modules/trip-transport/ticketInfo.api'
import * as tripTransportApi from '../../../../../../../../packages/domains/src/modules/trip-transport/tripTransport.api'
import { useTransportForm } from '../useTransportForm'

// ────────────────────────────────────────────────────────────
// 무엇을 테스트하는가
//
// useTransportForm 은 평평한 폼 값을 들고, 전송 시점에 종류별 제약이
// 살아있는 도메인 유니온(TripTransportCarrier)으로 접는다.
//
// 검증의 핵심은 "평평하게 들기"가 실제로 값을 지켜주는가:
//   항공으로 편명을 적다가 기차로 바꿔도 출발지·도착지는 남아야 하고,
//   그때 전송되는 값에는 항공 전용 필드가 섞이면 안 된다.
// ────────────────────────────────────────────────────────────

const TRIP_ID = 'trip-001'

const FLIGHT_INPUT = {
  type: TransportType.항공,
  departureName: '인천 국제공항',
  arrivalName: '간사이 국제공항',
  departureAt: '2026-09-21T01:00:00.000Z',
  airline: '대한항공',
  airlineCode: 'KE',
  flightNumber: '721',
}

function mockCreate() {
  return vi
    .spyOn(tripTransportApi, 'createTripTransport')
    .mockResolvedValue({ id: 'transport-001' } as never)
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(tripTransportApi, 'getTripTransports').mockResolvedValue([])
})

// 훅이 교통편 목록을 useSuspenseQuery 로 읽어, 첫 렌더는 suspend 되고 result 가 비어있다.
// 폼 조작을 검증하려면 조회가 풀릴 때까지 기다려야 한다.
async function renderTransportForm() {
  const rendered = renderHook(() => useTransportForm(TRIP_ID), { wrapper: createWrapper() })
  await waitFor(() => expect(rendered.result.current).not.toBeNull())

  return rendered
}

describe('useTransportForm', () => {
  it('update 는 넘긴 필드만 바꾸고 나머지 값을 유지한다', async () => {
    const { result } = await renderTransportForm()

    act(() => result.current.update({ departureName: '인천 국제공항' }))
    act(() => result.current.update({ arrivalName: '간사이 국제공항' }))

    expect(result.current.form).toEqual({
      departureName: '인천 국제공항',
      arrivalName: '간사이 국제공항',
    })
  })

  it('종류를 항공에서 기차로 바꿔도 이미 적은 여정 값이 남는다', async () => {
    const { result } = await renderTransportForm()

    act(() => result.current.update(FLIGHT_INPUT))
    act(() => result.current.update({ type: TransportType.기차 }))

    expect(result.current.form).toMatchObject({
      type: TransportType.기차,
      departureName: '인천 국제공항',
      arrivalName: '간사이 국제공항',
    })
  })

  it('필수값이 비어있으면 create 가 전송하지 않고 실패한다', async () => {
    const create = mockCreate()
    const { result } = await renderTransportForm()

    act(() => result.current.update({ type: TransportType.항공 }))

    await expect(result.current.create()).rejects.toThrow()
    expect(create).not.toHaveBeenCalled()
  })

  it('항공은 항공사·편명을 담아 전송한다', async () => {
    const create = mockCreate()
    const { result } = await renderTransportForm()

    act(() => result.current.update(FLIGHT_INPUT))
    await act(() => result.current.create())

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TransportType.항공,
        airline: '대한항공',
        airlineCode: 'KE',
        flightNumber: '721',
      }),
    )
  })

  it('기차·버스는 폼에 남은 항공사·편명을 전송에서 제외한다', async () => {
    const create = mockCreate()
    const { result } = await renderTransportForm()

    act(() => result.current.update(FLIGHT_INPUT))
    act(() => result.current.update({ type: TransportType.기차 }))
    await act(() => result.current.create())

    const [submitted] = create.mock.calls[0]
    expect(submitted).toMatchObject({ type: TransportType.기차 })
    expect(submitted).not.toHaveProperty('airline')
    expect(submitted).not.toHaveProperty('flightNumber')
  })

  it('교통편을 만든 뒤 그 id 로 티켓을 업로드한다', async () => {
    mockCreate()
    vi.spyOn(photoApi, 'uploadTransportTicketImage').mockResolvedValue('tickets/ticket-001.webp')
    vi.spyOn(ticketInfoApi, 'getTicketInfo').mockRejectedValue(new Error('판독 결과 없음'))
    const addTicket = vi
      .spyOn(tripTransportApi, 'createTripTransportTicket')
      .mockResolvedValue({ id: 'ticket-001' } as never)
    const { result } = await renderTransportForm()

    act(() =>
      result.current.update({
        ...FLIGHT_INPUT,
        tickets: [{ file: new File([''], 'ticket.png', { type: 'image/png' }) }],
      }),
    )
    await act(() => result.current.create())

    expect(addTicket).toHaveBeenCalledWith(
      expect.objectContaining({ transportId: 'transport-001' }),
    )
  })
})
