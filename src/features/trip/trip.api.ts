import { supabase } from '~api/client'
import { getAuth } from '~features/auth/useAuth'
import type { Trip } from './trip.types'
import { formatDate } from '../../shared/utils/formats';
import { deletePhotosByTripId } from '~features/photo/photo.api';
import { getCurrencyByDestination, type ExchangeRateEntry } from '../expense/currency';
import type { DataRaw } from '~api/tables.types';

function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export const tripKey = 'trips'

function toTrip(row: DataRaw<'trips'>): Trip {
  const destinations: string[] = (row as never as { destinations: string[] | null }).destinations
    ?? [row.destination]

  let exchangeRates: ExchangeRateEntry[] | null = (row.exchange_rates as ExchangeRateEntry[] | null) ?? null;
  if (!exchangeRates && row.exchange_rate != null) {
    const primaryCurrency = getCurrencyByDestination(destinations[0])[0];
    exchangeRates = [{ currencyCode: primaryCurrency.code, rate: row.exchange_rate }];
  }

  return {
    id: row.id,
    userId: (row as never as { user_id: string | null }).user_id ?? null,
    name: row.name,
    destinations,
    lat: row.lat,
    lng: row.lng,
    startDate: row.start_date,
    endDate: row.end_date,
    shareLink: row.share_link,
    createdAt: row.created_at,
    exchangeRate: row.exchange_rate,
    exchangeRates,
  }
}

export async function getAllTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false })
    .order('end_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toTrip)
}

export async function getTripById(id: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error('찾을 수 없는 여행 정보입니다.')
  }
  return toTrip(data);
}

export async function getTripByShareLink(shareLink: string): Promise<Trip | undefined> {
  const { data, error } = await supabase
    .rpc('get_trip_by_share_link', { link: shareLink })

  if (error) throw error
  return data?.[0] ? toTrip(data[0]) : undefined
}

export async function createTrip(
  data: Omit<Trip, 'id' | 'shareLink' | 'createdAt' | 'userId'>,
): Promise<Trip> {
  const user = getAuth()
  if (!user) throw new Error('로그인이 필요합니다')

  const userId = user.id
  const { data: created, error } = await supabase
    .from('trips')
    .insert({
      name: data.name,
      destination: data.destinations[0],
      destinations: data.destinations,
      lat: data.lat,
      lng: data.lng,
      start_date: data.startDate,
      end_date: data.endDate,
      share_link: crypto.randomUUID(),
      user_id: userId,
    } as never)
    .select()
    .single()

  if (error) throw error

  const trip = toTrip(created!)

  // 일자별 기본 경로 생성
  const dates = getDatesBetween(data.startDate, data.endDate)
  const routes = dates.map((date, idx) => ({
    trip_id: trip.id,
    name: `${formatDate(date)} 경로 1`,
    place_ids: [],
    place_memos: {},
    is_main: idx === 0,
    scheduled_date: date,
  }))

  if (routes.length > 0) {
    await supabase.from('routes').insert(routes as never)
  }

  // 생성자를 첫 번째 멤버로 추가
  await supabase
    .from('trip_members')
    .insert({ trip_id: trip.id, user_id: userId } as never)

  return trip
}

export async function updateTrip(id: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip | undefined> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.destinations !== undefined) {
    updateData.destination = data.destinations[0]
    updateData.destinations = data.destinations
  }
  if (data.lat !== undefined) updateData.lat = data.lat
  if (data.lng !== undefined) updateData.lng = data.lng
  if (data.startDate !== undefined) updateData.start_date = data.startDate
  if (data.endDate !== undefined) updateData.end_date = data.endDate
  if (data.shareLink !== undefined) updateData.share_link = data.shareLink
  if (data.exchangeRate !== undefined) updateData.exchange_rate = data.exchangeRate
  if (data.exchangeRates !== undefined) updateData.exchange_rates = data.exchangeRates

  const { data: updated, error } = await supabase
    .from('trips')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return updated ? toTrip(updated) : undefined
}

export async function deleteTrip(id: string): Promise<boolean> {
  await deletePhotosByTripId(id);

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
