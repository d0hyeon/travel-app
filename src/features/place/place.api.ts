import { supabase } from '~api/client'
import type { Place, PlaceCategoryType, PlaceStatus, TripPlace } from './place.types'

export const placeKey = 'places'

// ─────────────────────────────────────────
// 변환 헬퍼
// ─────────────────────────────────────────

function toPlace(row: {
  id: string
  name: string
  address: string | null
  lat: number
  lng: number
  provider: string
  external_id: string
  created_at: string
}): Place {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    provider: row.provider,
    externalId: row.external_id,
    createdAt: row.created_at,
  }
}

function toTripPlace(row: {
  id: string
  trip_id: string
  place_id: string
  status: string
  category: string | null
  memo: string | null
  tags: string[]
  created_at: string
  places: {
    name: string
    address: string | null
    lat: number
    lng: number
  }
}): TripPlace {
  return {
    id: row.id,
    placeId: row.place_id,
    tripId: row.trip_id,
    name: row.places.name,
    address: row.places.address ?? '',
    lat: row.places.lat,
    lng: row.places.lng,
    status: row.status as PlaceStatus,
    category: (row.category as PlaceCategoryType) ?? undefined,
    tags: row.tags ?? [],
    memo: row.memo ?? '',
    createdAt: row.created_at,
  }
}

const TRIP_PLACE_SELECT = `
  id, trip_id, place_id, status, category, memo, tags, created_at,
  places!inner(name, address, lat, lng)
` as const

// ─────────────────────────────────────────
// 전역 Place 조작
// ─────────────────────────────────────────

export async function upsertPlace(
  provider: string,
  externalId: string,
  data: { name: string; address: string; lat: number; lng: number },
): Promise<Place> {
  const { data: row, error } = await supabase
    .from('places')
    .upsert(
      { provider, external_id: externalId, name: data.name, address: data.address || null, lat: data.lat, lng: data.lng },
      { onConflict: 'provider,external_id', ignoreDuplicates: false },
    )
    .select()
    .single()

  if (error) throw error
  return toPlace(row!)
}

export async function getAllPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toPlace)
}

export async function getPlaceById(id: string): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return toPlace(data)
}

export async function updatePlace(
  id: string,
  data: Partial<Pick<Place, 'name' | 'address' | 'lat' | 'lng'>>,
): Promise<Place | undefined> {
  const patch: Record<string, unknown> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.address !== undefined) patch.address = data.address || null
  if (data.lat !== undefined) patch.lat = data.lat
  if (data.lng !== undefined) patch.lng = data.lng

  const { data: row, error } = await supabase
    .from('places')
    .update(patch as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return row ? toPlace(row) : undefined
}

// ─────────────────────────────────────────
// TripPlace 조작 (trip_places JOIN places)
// ─────────────────────────────────────────

export async function getTripPlacesByTripId(tripId: string): Promise<TripPlace[]> {
  const { data, error } = await supabase
    .from('trip_places')
    .select(TRIP_PLACE_SELECT)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => toTripPlace(row as Parameters<typeof toTripPlace>[0]))
}

export async function getAllTripPlaces(): Promise<TripPlace[]> {
  const { data, error } = await supabase
    .from('trip_places')
    .select(TRIP_PLACE_SELECT)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => toTripPlace(row as Parameters<typeof toTripPlace>[0]))
}

export async function getTripPlaceById(id: string): Promise<TripPlace> {
  const { data, error } = await supabase
    .from('trip_places')
    .select(TRIP_PLACE_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error
  return toTripPlace(data as Parameters<typeof toTripPlace>[0])
}

export async function createTripPlace(params: {
  tripId: string
  placeId: string
  status?: PlaceStatus
  memo?: string
  category?: PlaceCategoryType
  tags?: string[]
}): Promise<TripPlace> {
  const { data: row, error } = await supabase
    .from('trip_places')
    .insert({
      trip_id: params.tripId,
      place_id: params.placeId,
      status: params.status ?? 'wished',
      memo: params.memo || null,
      category: params.category || null,
      tags: params.tags ?? [],
    })
    .select(TRIP_PLACE_SELECT)
    .single()

  if (error) throw error
  return toTripPlace(row as Parameters<typeof toTripPlace>[0])
}

export async function updateTripPlace(
  id: string,
  data: Partial<Pick<TripPlace, 'status' | 'memo' | 'category' | 'tags'>>,
): Promise<TripPlace | undefined> {
  const patch: Record<string, unknown> = {}
  if (data.status !== undefined) patch.status = data.status
  if (data.memo !== undefined) patch.memo = data.memo || null
  if (data.category !== undefined) patch.category = data.category || null
  if (data.tags !== undefined) patch.tags = data.tags

  const { data: row, error } = await supabase
    .from('trip_places')
    .update(patch as never)
    .eq('id', id)
    .select(TRIP_PLACE_SELECT)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return row ? toTripPlace(row as Parameters<typeof toTripPlace>[0]) : undefined
}

export async function deleteTripPlace(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trip_places')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteTripPlacesByTripId(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_places')
    .delete()
    .eq('trip_id', tripId)

  if (error) throw error
}
