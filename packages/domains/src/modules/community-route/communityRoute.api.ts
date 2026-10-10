import { supabase } from '@waylog/domains/clients'
import type { Coordinate } from '@waylog/utility'
import type { CommunityPlace, CommunityRoute, CommunityTrip } from './communityRoute.types'

export const communityRouteKey = 'community-routes'

interface CommunityTripRow {
  community_key: string
  destinations: string[] | null
  nights: number
  preview_coordinates: Coordinate[] | null
}

interface CommunityRouteRow {
  day_number: number | null
  places: CommunityPlace[] | null
}

export async function getCommunityTrips(
  destinations: string[],
  excludeTripId: string,
): Promise<CommunityTrip[]> {
  const { data, error } = await supabase.rpc(
    'get_community_trips',
    { p_destinations: destinations, p_exclude_trip_id: excludeTripId },
  )

  if (error) throw error

  const rows = (data ?? []) as unknown as CommunityTripRow[]
  return rows.map((row) => ({
    communityKey: row.community_key,
    destinations: row.destinations ?? [],
    nights: row.nights,
    previewCoordinates: row.preview_coordinates ?? [],
  }))
}

export async function getCommunityTripRoutes(communityKey: string): Promise<CommunityRoute[]> {
  const { data, error } = await supabase.rpc(
    'get_community_trip_routes',
    { p_community_key: communityKey },
  )

  if (error) throw error

  const rows = (data ?? []) as unknown as CommunityRouteRow[]
  return rows.map((row) => ({
    dayNumber: row.day_number ?? undefined,
    places: row.places ?? [],
  }))
}
