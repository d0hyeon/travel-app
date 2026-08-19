import { useSuspenseQuery } from '@tanstack/react-query'
import { supabase } from '@waylog/domains/api'
import { toTrip, tripKey } from '~features/trip/trip.api'
import type { Trip } from '~features/trip/trip.types'

async function fetchUserTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .rpc('get_user_trips', {
      p_user_id: userId,
    })
  
  if (error) throw error
  return (data ?? []).map(toTrip)
}

export function useUserTrips(userId: string) {
  return useSuspenseQuery({
    queryKey: useUserTrips.key(userId),
    queryFn: () => fetchUserTrips(userId),
  })
}

useUserTrips.key = (userId: string) => [tripKey, 'by-user', userId]
