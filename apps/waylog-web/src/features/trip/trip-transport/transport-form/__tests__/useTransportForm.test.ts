import { act, renderHook } from '@testing-library/react'
import { TransportType } from '@waylog/domains/modules/transport'
import { describe, expect, it } from 'vitest'
import { useTransportForm } from '../useTransportForm'

describe('useTransportForm', () => {
  it('선택한 교통수단을 다음 단계에서 읽을 수 있다', () => {
    const { result } = renderHook(() => useTransportForm())

    act(() => result.current.selectType(TransportType.항공))

    expect(result.current.type).toBe(TransportType.항공)
  })

  it('상세 입력을 저장해 이전 단계로 돌아와도 유지한다', () => {
    const { result } = renderHook(() => useTransportForm())
    const detail = {
      departureName: '인천 국제공항',
      arrivalName: '간사이 국제공항',
      departureAt: '2026-09-21T01:00:00.000Z',
    }

    act(() => result.current.saveDetail(detail))

    expect(result.current.detail).toEqual(detail)
  })
})
