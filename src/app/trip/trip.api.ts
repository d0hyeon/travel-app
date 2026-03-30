import { supabase } from '../../shared/lib/supabase'
import type { Trip } from './trip.types'
import { formatDate } from '../../shared/utils/formats';
import { deletePhotosByTripId } from '~app/photo/photo.api';
import { getCurrencyByDestination, type ExchangeRateEntry } from '../expense/currency';
import type { DataRaw } from '~shared/lib/database-row.types';
import { getRandomEmoji } from './trip-member/tripMember.types';

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

// DB row -> App model 변환
function toTrip(row: DataRaw<'trips'>): Trip {
  // 기존 단일 환율 → 배열로 자동 마이그레이션
  let exchangeRates: ExchangeRateEntry[] | null = (row.exchange_rates as ExchangeRateEntry[] | null) ?? null;
  if (!exchangeRates && row.exchange_rate != null) {
    const currency = getCurrencyByDestination(row.destination);
    exchangeRates = [{ currencyCode: currency.code, rate: row.exchange_rate }];
  }

  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    lat: row.lat,
    lng: row.lng,
    startDate: row.start_date,
    endDate: row.end_date,
    shareLink: row.share_link,
    createdAt: row.created_at,
    isOverseas: row.is_overseas,
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

export async function getTripById(id: string): Promise<Trip | undefined> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined // not found
    throw error
  }
  return data ? toTrip(data) : undefined
}

export async function getTripByShareLink(shareLink: string): Promise<Trip | undefined> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('share_link', shareLink)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return data ? toTrip(data) : undefined
}

export async function createTrip(
  data: Omit<Trip, 'id' | 'shareLink' | 'createdAt'>,
  memberNames: string[] = []
): Promise<Trip> {
  const { data: created, error } = await supabase
    .from('trips')
    .insert({
      name: data.name,
      destination: data.destination,
      lat: data.lat,
      lng: data.lng,
      start_date: data.startDate,
      end_date: data.endDate,
      share_link: crypto.randomUUID(),
      is_overseas: data.isOverseas,
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

  // 멤버 일괄 생성
  if (memberNames.length > 0) {
    const members = memberNames.map((name) => ({
      trip_id: trip.id,
      name,
      emoji: getRandomEmoji(),
    }))
    await supabase.from('trip_members').insert(members as never)
  }

  return trip
}

export async function updateTrip(id: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip | undefined> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.destination !== undefined) updateData.destination = data.destination
  if (data.lat !== undefined) updateData.lat = data.lat
  if (data.lng !== undefined) updateData.lng = data.lng
  if (data.startDate !== undefined) updateData.start_date = data.startDate
  if (data.endDate !== undefined) updateData.end_date = data.endDate
  if (data.shareLink !== undefined) updateData.share_link = data.shareLink
  if (data.isOverseas !== undefined) updateData.is_overseas = data.isOverseas
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
