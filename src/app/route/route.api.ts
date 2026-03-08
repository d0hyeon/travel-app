import type { DataRaw } from '~shared/lib/database-row.types'
import type { Json } from '~shared/lib/database.types'
import { supabase } from '../../shared/lib/supabase'
import type { Route } from './route.types'

export const routeKey = 'routes'

// DB row -> App model 변환
// 기존 string 형태를 string[] 형태로 마이그레이션 호환
function normalizePlaceMemos(memos: Json): Record<string, string[]> {
  if (!memos) return {}
  const result: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(memos)) {
    if (Array.isArray(value)) {
      result[key] = value
    } else if (typeof value === 'string' && value) {
      // 기존 string -> string[] 마이그레이션
      result[key] = [value]
    }
  }
  return result
}

function toRoute(row: DataRaw<'routes'>): Route {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    placeIds: row.place_ids ?? [],
    placeMemos: normalizePlaceMemos(row.place_memos),
    isMain: row.is_main,
    scheduledDate: row.scheduled_date ?? undefined,
    createdAt: row.created_at,
    hiddenPlaces: row.hidden_places ?? [],
  }
}

export async function getAllRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toRoute)
}

export async function getRoutesByTripId(tripId: string): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toRoute)
}

export async function getRouteById(id: string): Promise<Route | undefined> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return data ? toRoute(data) : undefined
}

export async function getMainRoute(tripId: string): Promise<Route | undefined> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_main', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return data ? toRoute(data) : undefined
}

export async function createRoute(data: Omit<Route, 'id' | 'createdAt' | "hiddenPlaces">): Promise<Route> {
  // isMain이 true면 기존 메인 경로를 해제
  if (data.isMain) {
    await supabase
      .from('routes')
      .update({ is_main: false } as never)
      .eq('trip_id', data.tripId)
      .eq('is_main', true)
  }

  const { data: created, error } = await supabase
    .from('routes')
    .insert({
      trip_id: data.tripId,
      name: data.name,
      place_ids: data.placeIds,
      place_memos: data.placeMemos ?? {},
      is_main: data.isMain,
      scheduled_date: data.scheduledDate ?? null,
    } as never)
    .select()
    .single()

  if (error) throw error
  return toRoute(created!)
}

export async function updateRoute(id: string, data: Partial<Omit<Route, 'id' | 'tripId' | 'createdAt'>>): Promise<Route | undefined> {
  // isMain이 true면 기존 메인 경로를 해제
  if (data.isMain) {
    const route = await getRouteById(id)
    if (route) {
      await supabase
        .from('routes')
        .update({ is_main: false } as never)
        .eq('trip_id', route.tripId)
        .eq('is_main', true)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.placeIds !== undefined) updateData.place_ids = data.placeIds
  if (data.placeMemos !== undefined) updateData.place_memos = data.placeMemos
  if (data.isMain !== undefined) updateData.is_main = data.isMain
  if (data.scheduledDate !== undefined) updateData.scheduled_date = data.scheduledDate ?? null
  if(data.hiddenPlaces !== null) updateData.hidden_places = data.hiddenPlaces ?? undefined

  const { data: updated, error } = await supabase
    .from('routes')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw error
  }
  return updated ? toRoute(updated) : undefined
}

export async function deleteRoute(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteRoutesByTripId(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('trip_id', tripId)

  if (error) throw error
}

export async function getPlaceUsedDates(tripId: string, placeId: string): Promise<string[]> {
  const routes = await getRoutesByTripId(tripId)
  return routes
    .filter((route) => route.placeIds.includes(placeId) && route.scheduledDate)
    .map((route) => route.scheduledDate!)
}
