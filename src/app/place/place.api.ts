import { supabase } from '../../shared/lib/supabase'
import type { Place, PlaceCategoryType } from './place.types'

export const placeKey = 'places'

// DB row -> App model 변환
function toPlace(row: {
  id: string
  trip_id: string
  name: string
  address: string | null
  lat: number
  lng: number
  status: string
  category: string | null
  tags: string[]
  memo: string | null
  created_at: string
}): Place {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    status: row.status as Place['status'],
    category: (row.category as PlaceCategoryType) ?? undefined,
    tags: row.tags ?? [],
    memo: row.memo ?? '',
    createdAt: row.created_at,
  }
}

export async function getAllPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toPlace)
}

export async function getPlacesByTripId(tripId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('trip_id', tripId)
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

  if (error) throw error;
  return toPlace(data);
}

export async function createPlace(data: Omit<Place, 'id' | 'createdAt'>): Promise<Place> {
  const { data: created, error } = await supabase
    .from('places')
    .insert({
      trip_id: data.tripId,
      name: data.name,
      address: data.address || null,
      lat: data.lat,
      lng: data.lng,
      status: data.status,
      category: data.category || null,
      tags: data.tags,
      memo: data.memo || null,
    } as never)
    .select()
    .single()

  if (error) throw error
  return toPlace(created!)
}

export async function updatePlace(id: string, data: Partial<Omit<Place, 'id' | 'tripId' | 'createdAt'>>): Promise<Place | undefined> {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.address !== undefined) updateData.address = data.address || null
  if (data.lat !== undefined) updateData.lat = data.lat
  if (data.lng !== undefined) updateData.lng = data.lng
  if (data.status !== undefined) updateData.status = data.status
  if (data.category !== undefined) updateData.category = data.category || null
  if (data.tags !== undefined) updateData.tags = data.tags
  if (data.memo !== undefined) updateData.memo = data.memo || null

  const { data: updated, error } = await supabase
    .from('places')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return updated ? toPlace(updated) : undefined
}

export async function deletePlace(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deletePlacesByTripId(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('trip_id', tripId)

  if (error) throw error
}
