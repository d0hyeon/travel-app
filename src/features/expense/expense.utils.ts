import type { TripMember } from '../trip/trip-member/tripMember.types'
import type { Expense, SettlementBalance, SettlementTransaction } from './expense.types'
import { convertToKRW, type ExchangeRateEntry } from './currency'

/**
 * 각 멤버의 잔액 계산
 * 양수: 받을 돈 (더 많이 지불함)
 * 음수: 낼 돈 (덜 지불함)
 */
export function calculateBalances(
  members: TripMember[],
  expenses: Expense[]
): SettlementBalance[] {
  const balances: Record<string, number> = {}

  members.forEach(m => {
    balances[m.id] = 0
  })

  expenses.forEach(expense => {
    // 1. 지불한 사람들에게 양수 (실제 지출액)
    expense.payments.forEach(payment => {
      if (balances[payment.memberId] !== undefined) {
        balances[payment.memberId] += payment.amount
      }
    })

    // 2. 분담 대상자들에게 음수 (1/n)
    if (expense.splitAmong.length > 0) {
      const perPerson = expense.totalAmount / expense.splitAmong.length
      expense.splitAmong.forEach(memberId => {
        if (balances[memberId] !== undefined) {
          balances[memberId] -= perPerson
        }
      })
    }
  })

  return members.map(m => ({
    memberId: m.id,
    balance: Math.round(balances[m.id])
  }))
}

/**
 * 최소 거래 횟수로 정산하는 방법 계산
 */
export function calculateSettlements(
  balances: SettlementBalance[]
): SettlementTransaction[] {
  const transactions: SettlementTransaction[] = []
  const remaining = balances.map(b => ({ ...b }))

  while (true) {
    const debtors = remaining.filter(b => b.balance < -1)
    const creditors = remaining.filter(b => b.balance > 1)

    if (debtors.length === 0 || creditors.length === 0) break

    debtors.sort((a, b) => a.balance - b.balance)
    creditors.sort((a, b) => b.balance - a.balance)

    const debtor = debtors[0]
    const creditor = creditors[0]

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance)

    if (amount > 0) {
      transactions.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: Math.round(amount)
      })

      debtor.balance += amount
      creditor.balance -= amount
    }
  }

  return transactions
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export function getTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.totalAmount, 0)
}

/**
 * 모든 지출을 원화로 환산한 총액
 * @param exchangeRates 통화별 환율 배열 (1 외화 = X원)
 */
export function getTotalExpensesInKRW(expenses: Expense[], exchangeRates?: ExchangeRateEntry[] | null): number {
  return expenses.reduce((sum, e) => {
    const amountInKRW = convertToKRW(e.totalAmount, e.currency, exchangeRates)
    return sum + amountInKRW
  }, 0)
}

/**
 * 원화 환산 기준으로 잔액 계산
 * @param exchangeRates 통화별 환율 배열 (1 외화 = X원)
 */
export function calculateBalancesInKRW(
  members: TripMember[],
  expenses: Expense[],
  exchangeRates?: ExchangeRateEntry[] | null
): SettlementBalance[] {
  const balances: Record<string, number> = {}

  members.forEach(m => {
    balances[m.id] = 0
  })

  expenses.forEach(expense => {
    const totalInKRW = convertToKRW(expense.totalAmount, expense.currency, exchangeRates)

    // 1. 지불한 사람들에게 양수 (원화 환산)
    expense.payments.forEach(payment => {
      if (balances[payment.memberId] !== undefined) {
        const paymentInKRW = convertToKRW(payment.amount, expense.currency, exchangeRates)
        balances[payment.memberId] += paymentInKRW
      }
    })

    // 2. 분담 대상자들에게 음수 (1/n)
    if (expense.splitAmong.length > 0) {
      const perPerson = totalInKRW / expense.splitAmong.length
      expense.splitAmong.forEach(memberId => {
        if (balances[memberId] !== undefined) {
          balances[memberId] -= perPerson
        }
      })
    }
  })

  return members.map(m => ({
    memberId: m.id,
    balance: Math.round(balances[m.id])
  }))
}
