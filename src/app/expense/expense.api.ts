import type { DataRaw } from '~shared/lib/database-row.types'
import type { Json } from '~shared/lib/database.types'
import { supabase } from '../../shared/lib/supabase'
import type { Expense } from './expense.types'

export const expenseKey = 'expenses'

function toExpense(row: DataRaw<'expenses'>): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    placeId: row.place_id ?? undefined,
    description: row.description ?? '',
    totalAmount: row.total_amount,
    currency: (row as { currency?: string }).currency ?? 'KRW',
    // @ts-ignore
    payments: row.payments ?? [],
    splitAmong: row.split_among ?? [],
    date: row.date ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getExpensesByTripId(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toExpense)
}

export async function createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const { data: created, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: data.tripId,
      place_id: data.placeId || null,
      description: data.description,
      total_amount: data.totalAmount,
      currency: data.currency,
      payments: data.payments as unknown as Json,
      split_among: data.splitAmong,
      date: data.date,
    })
    .select()
    .single()

  if (error) throw error
  return toExpense(created)
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt'>>
): Promise<Expense | undefined> {
  const updateData: Record<string, unknown> = {}
  if (data.placeId !== undefined) updateData.place_id = data.placeId || null
  if (data.description !== undefined) updateData.description = data.description
  if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.payments !== undefined) updateData.payments = data.payments
  if (data.splitAmong !== undefined) updateData.split_among = data.splitAmong
  if (data.date !== undefined) updateData.date = data.date

  const { data: updated, error } = await supabase
    .from('expenses')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return updated ? toExpense(updated) : undefined
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
