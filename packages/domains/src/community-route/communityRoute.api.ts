import { supabase } from '@waylog/domains/api'
import type { CommunityTrip, CommunityRouteWithPlaces, CommunityPlace } from './communityRoute.types'

export const communityRouteKey = 'community-routes'

interface PreviewRouteRow {
  scheduledDate?: string | null
  coords: { lat: number; lng: number }[] | null
}

interface CommunityTripRow {
  id: string
  destinations: string[]
  start_date: string
  end_date: string
  route_count: number
  member_count: number
  preview_coordinates: PreviewRouteRow[] | null
}

interface CommunityRoutePlaceRow {
  route_id: string
  route_name: string
  scheduled_date: string | null
  place_id: string
  place_name: string
  place_address: string
  place_lat: number
  place_lng: number
  place_order: number
}

export async function getTripsByDestination(
  destinations: string[],
  excludeTripId: string,
): Promise<CommunityTrip[]> {
  const { data, error } = await supabase.rpc(
    'get_trips_by_destination',
    { p_destinations: destinations, p_exclude_trip_id: excludeTripId },
  )

  if (error) throw error

  const rows = (data ?? []) as unknown as CommunityTripRow[]
  return rows.map((row) => ({
    id: row.id,
    destinations: row.destinations ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    routeCount: row.route_count,
    memberCount: row.member_count,
    previewRoutes: (row.preview_coordinates ?? []).map((r) => ({
      scheduledDate: r.scheduledDate ?? undefined,
      coords: r.coords ?? [],
    })),
  }))
}

export async function getRoutesWithPlacesByTripId(
  tripId: string,
): Promise<CommunityRouteWithPlaces[]> {
  const { data, error } = await supabase.rpc(
    'get_routes_with_places_by_trip_id',
    { p_trip_id: tripId },
  )

  if (error) throw error

  const rows = (data ?? []) as unknown as CommunityRoutePlaceRow[]

  const routeMap = new Map<string, CommunityRouteWithPlaces>()
  for (const row of rows) {
    if (!routeMap.has(row.route_id)) {
      routeMap.set(row.route_id, {
        id: row.route_id,
        name: row.route_name,
        scheduledDate: row.scheduled_date ?? undefined,
        places: [],
      })
    }
    if (row.place_id) {
      const place: CommunityPlace = {
        id: row.place_id,
        name: row.place_name,
        address: row.place_address ?? '',
        lat: row.place_lat,
        lng: row.place_lng,
        order: row.place_order,
      }
      routeMap.get(row.route_id)!.places.push(place)
    }
  }

  return Array.from(routeMap.values())
}
