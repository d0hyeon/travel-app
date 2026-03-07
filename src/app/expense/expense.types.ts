export interface ExpensePayment {
  memberId: string
  amount: number
}

export interface Expense {
  id: string
  tripId: string
  placeId?: string
  description: string
  totalAmount: number
  payments: ExpensePayment[]
  splitAmong: string[]
  date?: string
  createdAt: string
}

export interface SettlementBalance {
  memberId: string
  balance: number
}

export interface SettlementTransaction {
  from: string
  to: string
  amount: number
}
