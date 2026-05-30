import { describe, it, expect } from 'vitest'
import { calculateBalancesInKRW, calculateSettlements } from '../expense.utils'
import type { Expense } from '../expense.types'
import type { TripMember } from '../../trip/trip-member/tripMember.types'

// ────────────────────────────────────────────────────────────
// 테스트 픽스처
//
// 테스트마다 공유하는 멤버 데이터.
// 실제 DB 스키마와 동일한 구조지만 최소한의 필드만 채운다.
// ────────────────────────────────────────────────────────────

function makeMember(id: string): TripMember {
  return {
    id,
    tripId: 'trip-001',
    userId: `user-${id}`,
    name: id,
    avatarUrl: null,
    isHost: false,
  }
}

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'payments' | 'splitAmong' | 'totalAmount'>): Expense {
  return {
    id: crypto.randomUUID(),
    tripId: 'trip-001',
    description: '테스트 지출',
    currency: 'KRW',
    date: '2025-07-01',
    createdAt: '2025-07-01T00:00:00Z',
    ...overrides,
  }
}

const A = makeMember('A')
const B = makeMember('B')
const C = makeMember('C')

// ────────────────────────────────────────────────────────────
// 케이스 1: 정산 파이프라인 통합
//
// calculateBalancesInKRW → calculateSettlements를 거치는
// 전체 흐름을 시나리오 단위로 검증한다.
//
// 단위 테스트와의 차이:
//   - 각 함수를 개별로 검증하는 게 아니라
//   - "실제 여행에서 이런 상황이면 정산 결과가 이렇다"를 검증한다
// ────────────────────────────────────────────────────────────

describe('정산 파이프라인 통합', () => {
  describe('2명 여행', () => {
    it('A가 전액 냈을 때 B가 절반을 A에게 준다', () => {
      // Arrange
      const members = [A, B]
      const expenses = [
        makeExpense({
          totalAmount: 100_000,
          payments: [{ memberId: 'A', amount: 100_000 }],
          splitAmong: ['A', 'B'],
        }),
      ]

      // Act
      const balances = calculateBalancesInKRW(members, expenses)
      const settlements = calculateSettlements(balances)

      // Assert
      expect(settlements).toHaveLength(1)
      expect(settlements[0]).toEqual({ from: 'B', to: 'A', amount: 50_000 })
    })

    it('각자 절반씩 냈을 때 정산 거래가 없다', () => {
      const members = [A, B]
      const expenses = [
        makeExpense({
          totalAmount: 100_000,
          payments: [
            { memberId: 'A', amount: 50_000 },
            { memberId: 'B', amount: 50_000 },
          ],
          splitAmong: ['A', 'B'],
        }),
      ]

      const balances = calculateBalancesInKRW(members, expenses)
      const settlements = calculateSettlements(balances)

      expect(settlements).toHaveLength(0)
    })

    it('여러 건의 지출이 누적되어도 최종 잔액 기준으로 한 번만 정산한다', () => {
      // A가 식비 6만원, B가 숙박 4만원 — 총 10만원을 각자 냄
      // 실제 부담은 각 5만원이므로 A가 B에게 1만원을 받아야 함
      const members = [A, B]
      const expenses = [
        makeExpense({
          description: '식비',
          totalAmount: 60_000,
          payments: [{ memberId: 'A', amount: 60_000 }],
          splitAmong: ['A', 'B'],
        }),
        makeExpense({
          description: '숙박',
          totalAmount: 40_000,
          payments: [{ memberId: 'B', amount: 40_000 }],
          splitAmong: ['A', 'B'],
        }),
      ]

      const balances = calculateBalancesInKRW(members, expenses)
      const settlements = calculateSettlements(balances)

      // A가 10만원 지출, B가 5만원 부담 → B→A 1만원
      expect(settlements).toHaveLength(1)
      expect(settlements[0]).toEqual({ from: 'B', to: 'A', amount: 10_000 })
    })
  })

  describe('3명 여행', () => {
    it('A가 전액 냈을 때 B·C가 각자 1/3씩 A에게 준다', () => {
      const members = [A, B, C]
      const expenses = [
        makeExpense({
          totalAmount: 90_000,
          payments: [{ memberId: 'A', amount: 90_000 }],
          splitAmong: ['A', 'B', 'C'],
        }),
      ]

      const balances = calculateBalancesInKRW(members, expenses)
      const settlements = calculateSettlements(balances)

      // B → A 30,000 / C → A 30,000 — 각자 A에게 직접 주는 게 최소 거래
      expect(settlements).toHaveLength(2)
      expect(settlements.every(s => s.to === 'A')).toBe(true)
      expect(settlements.every(s => s.amount === 30_000)).toBe(true)
    })

    it('분담 대상이 다를 때 각자 올바른 금액만 부담한다', () => {
      // A·B만 참여한 식비, B·C만 참여한 택시비
      const members = [A, B, C]
      const expenses = [
        makeExpense({
          description: 'A·B 식비 (B 결제)',
          totalAmount: 40_000,
          payments: [{ memberId: 'B', amount: 40_000 }],
          splitAmong: ['A', 'B'],
        }),
        makeExpense({
          description: 'B·C 택시 (B 결제)',
          totalAmount: 30_000,
          payments: [{ memberId: 'B', amount: 30_000 }],
          splitAmong: ['B', 'C'],
        }),
      ]

      const balances = calculateBalancesInKRW(members, expenses)

      // A 잔액: 0(지불) - 20,000(식비 1/2) = -20,000
      // B 잔액: 70,000(지불) - 20,000(식비 1/2) - 15,000(택시 1/2) = +35,000
      // C 잔액: 0(지불) - 15,000(택시 1/2) = -15,000
      const balanceMap = Object.fromEntries(balances.map(b => [b.memberId, b.balance]))
      expect(balanceMap['A']).toBe(-20_000)
      expect(balanceMap['B']).toBe(35_000)
      expect(balanceMap['C']).toBe(-15_000)
    })
  })
})

// ────────────────────────────────────────────────────────────
// 케이스 2: 환율 변환 + 정산 통합
//
// convertToKRW가 calculateBalancesInKRW 안에서 올바르게 동작하는지
// 커스텀 환율과 기본 환율 두 가지 경로를 검증한다.
// ────────────────────────────────────────────────────────────

describe('환율 변환 + 정산 통합', () => {
  it('JPY 지출에 커스텀 환율이 적용된다', () => {
    // 1,000엔 지출, 커스텀 환율 10원/엔 → 10,000원
    const members = [A, B]
    const expenses = [
      makeExpense({
        totalAmount: 1_000,
        currency: 'JPY',
        payments: [{ memberId: 'A', amount: 1_000 }],
        splitAmong: ['A', 'B'],
      }),
    ]
    const exchangeRates = [{ currencyCode: 'JPY' as const, rate: 10 }]

    const balances = calculateBalancesInKRW(members, expenses, exchangeRates)
    const settlements = calculateSettlements(balances)

    // 10,000원의 절반인 5,000원을 B가 A에게 줘야 함
    expect(settlements).toHaveLength(1)
    expect(settlements[0].amount).toBe(5_000)
  })

  it('커스텀 환율이 없으면 기본 환율(EXCHANGE_RATES)을 사용한다', () => {
    // 1,000엔, 기본 환율 약 9원/엔 → 약 9,000원
    const members = [A, B]
    const expenses = [
      makeExpense({
        totalAmount: 1_000,
        currency: 'JPY',
        payments: [{ memberId: 'A', amount: 1_000 }],
        splitAmong: ['A', 'B'],
      }),
    ]

    const balances = calculateBalancesInKRW(members, expenses, null)
    const settlements = calculateSettlements(balances)

    // 기본 환율 적용 → 결과가 0이 아닌 양수여야 함
    expect(settlements).toHaveLength(1)
    expect(settlements[0].amount).toBeGreaterThan(0)
  })

  it('KRW 지출은 환율 변환 없이 그대로 계산된다', () => {
    const members = [A, B]
    const expenses = [
      makeExpense({
        totalAmount: 50_000,
        currency: 'KRW',
        payments: [{ memberId: 'A', amount: 50_000 }],
        splitAmong: ['A', 'B'],
      }),
    ]

    const balances = calculateBalancesInKRW(members, expenses)
    const settlements = calculateSettlements(balances)

    expect(settlements[0].amount).toBe(25_000)
  })
})

// ────────────────────────────────────────────────────────────
// 케이스 3: 엣지 케이스
//
// 경계값에서 파이프라인이 안전하게 동작하는지 검증한다.
// 이 케이스들은 실제 앱에서 자주 발생하는 상황이다:
//   - 여행 초반에 지출이 없는 상태
//   - 1인 여행
//   - splitAmong이 비어있는 지출 (삭제된 멤버 등)
// ────────────────────────────────────────────────────────────

describe('엣지 케이스', () => {
  it('지출이 없으면 정산 거래가 없다', () => {
    const balances = calculateBalancesInKRW([A, B], [])
    const settlements = calculateSettlements(balances)
    expect(settlements).toHaveLength(0)
  })

  it('멤버가 1명이면 정산 거래가 없다', () => {
    const expenses = [
      makeExpense({
        totalAmount: 50_000,
        payments: [{ memberId: 'A', amount: 50_000 }],
        splitAmong: ['A'],
      }),
    ]
    const balances = calculateBalancesInKRW([A], expenses)
    const settlements = calculateSettlements(balances)
    expect(settlements).toHaveLength(0)
  })

  it('splitAmong이 비어있는 지출은 분담 계산에서 제외된다', () => {
    // splitAmong이 비어있으면 아무도 분담하지 않음 → A의 잔액은 그대로
    const expenses = [
      makeExpense({
        totalAmount: 50_000,
        payments: [{ memberId: 'A', amount: 50_000 }],
        splitAmong: [],
      }),
    ]
    const balances = calculateBalancesInKRW([A, B], expenses)
    const balanceMap = Object.fromEntries(balances.map(b => [b.memberId, b.balance]))

    // A는 50,000원 냈는데 아무도 분담 안 함 → A 잔액 +50,000, B 잔액 0
    expect(balanceMap['A']).toBe(50_000)
    expect(balanceMap['B']).toBe(0)
  })

  it('총 잔액의 합은 항상 0이다 (보존 법칙)', () => {
    // 어떤 지출 시나리오에서도 잔액의 합은 0이어야 한다
    const members = [A, B, C]
    const expenses = [
      makeExpense({
        totalAmount: 75_000,
        payments: [
          { memberId: 'A', amount: 50_000 },
          { memberId: 'B', amount: 25_000 },
        ],
        splitAmong: ['A', 'B', 'C'],
      }),
      makeExpense({
        totalAmount: 30_000,
        currency: 'JPY',
        payments: [{ memberId: 'C', amount: 30_000 }],
        splitAmong: ['B', 'C'],
      }),
    ]
    const exchangeRates = [{ currencyCode: 'JPY' as const, rate: 10 }]

    const balances = calculateBalancesInKRW(members, expenses, exchangeRates)
    const total = balances.reduce((sum, b) => sum + b.balance, 0)

    // 부동소수점 오차 허용 (±1원)
    expect(Math.abs(total)).toBeLessThanOrEqual(1)
  })
})
