import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExpenses } from '../useExpenses'
import * as expenseApi from '@waylog/domains/expense'
import * as placeApi from '../../place/place.api'

import type { Expense } from '@waylog/domains/expense'
import { createWrapper } from '~fixtures/wraper'

// ────────────────────────────────────────────────────────────
// 무엇을 테스트하는가
//
// useExpenses는 두 가지 의존성을 갖는다:
//   1. getExpensesByTripId — 지출 목록 조회
//   2. useTripPlaces (내부적으로 getTripPlacesByTripId) — 장소 연결
//
// 두 API를 모두 Mock하면:
//   - create 시 totalAmount 자동 합산 로직 검증
//   - create 후 캐시 prepend 로직 검증
//   - remove 후 캐시에서 제거 검증
//
// "통합"의 의미:
//   create() 호출 → createExpense() 실행 → onSuccess 캐시 갱신
//   이 세 단계가 올바르게 연결됐는지 하나의 테스트에서 검증한다
// ────────────────────────────────────────────────────────────

const TRIP_ID = 'trip-001'

const MOCK_EXPENSE: Expense = {
  id: 'expense-001',
  tripId: TRIP_ID,
  description: '라멘',
  totalAmount: 15_000,
  currency: 'KRW',
  payments: [{ memberId: 'member-A', amount: 15_000 }],
  splitAmong: ['member-A', 'member-B'],
  date: '2025-07-01',
  createdAt: '2025-07-01T12:00:00Z',
}

function setupMocks(expenses: Expense[] = [MOCK_EXPENSE]) {
  vi.spyOn(expenseApi, 'getExpensesByTripId').mockResolvedValue(expenses)
  vi.spyOn(placeApi, 'getTripPlacesByTripId').mockResolvedValue([])
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useExpenses', () => {
  // ──────────────────────────────────────────────────────────
  // 케이스 1: create — totalAmount 자동 합산
  //
  // create()는 payments 배열의 amount 합계로 totalAmount를 계산해서
  // createExpense()에 전달한다. 호출부가 totalAmount를 직접 계산할 필요 없다.
  //
  // 이것이 통합 테스트인 이유:
  //   - 훅 내부의 합산 로직이 실제로 실행되는지
  //   - createExpense가 올바른 인자로 호출되는지
  //   두 가지를 함께 검증한다
  // ──────────────────────────────────────────────────────────
  it('create 시 payments 합계가 totalAmount로 자동 계산된다', async () => {
    setupMocks([])
    const createSpy = vi.spyOn(expenseApi, 'createExpense').mockResolvedValue({
      ...MOCK_EXPENSE,
      id: 'expense-new',
      totalAmount: 30_000,
    })

    const { result } = renderHook(() => useExpenses(TRIP_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    act(() => {
      result.current.create({
        description: '초밥',
        currency: 'KRW',
        payments: [
          { memberId: 'member-A', amount: 20_000 },
          { memberId: 'member-B', amount: 10_000 },
        ],
        splitAmong: ['member-A', 'member-B'],
        date: '2025-07-01',
      })
    })

    await waitFor(() => expect(createSpy).toHaveBeenCalledOnce())

    // createExpense에 totalAmount: 30_000이 전달됐는지 검증
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 30_000 })
    )
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 3: create 후 캐시 prepend
  //
  // create 성공 시 onSuccess에서 queryClient.setQueryData로
  // 새 항목을 목록 맨 앞에 추가한다.
  // refetch 없이 즉시 UI가 갱신되는 낙관적 업데이트 패턴이다.
  // ──────────────────────────────────────────────────────────
  it('create 성공 후 새 지출이 목록 맨 앞에 추가된다', async () => {
    setupMocks([MOCK_EXPENSE])

    const newExpense: Expense = {
      ...MOCK_EXPENSE,
      id: 'expense-new',
      description: '초밥',
      totalAmount: 30_000,
      createdAt: '2025-07-02T12:00:00Z',
    }
    vi.spyOn(expenseApi, 'createExpense').mockResolvedValue(newExpense)

    const { result } = renderHook(() => useExpenses(TRIP_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toHaveLength(1))

    act(() => {
      result.current.create({
        description: '초밥',
        currency: 'KRW',
        payments: [{ memberId: 'member-A', amount: 30_000 }],
        splitAmong: ['member-A'],
        date: '2025-07-02',
      })
    })

    // 새 항목이 맨 앞(index 0)에 추가됐는지
    await waitFor(() => expect(result.current.data).toHaveLength(2))
    expect(result.current.data[0].id).toBe('expense-new')
    expect(result.current.data[0].description).toBe('초밥')
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 4: remove 후 캐시에서 제거
  //
  // remove 성공 시 onSuccess에서 해당 id를 캐시에서 filter out한다.
  // ──────────────────────────────────────────────────────────
  it('remove 성공 후 해당 지출이 목록에서 제거된다', async () => {
    const twoExpenses: Expense[] = [
      MOCK_EXPENSE,
      { ...MOCK_EXPENSE, id: 'expense-002', description: '택시' },
    ]
    setupMocks(twoExpenses)
    vi.spyOn(expenseApi, 'deleteExpense').mockResolvedValue(true)

    const { result } = renderHook(() => useExpenses(TRIP_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    act(() => {
      result.current.remove('expense-001')
    })

    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(result.current.data[0].id).toBe('expense-002')
  })
})
