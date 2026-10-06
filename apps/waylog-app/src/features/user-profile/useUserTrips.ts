import { useSuspenseQuery } from '@tanstack/react-query'
import { tripKey } from '@waylog/domains/modules/trip'
import { getUserTrips } from './user-profile.api'

export function useUserTrips(userId: string) {
  return useSuspenseQuery({
    queryKey: [tripKey, 'by-user', userId],
    queryFn: () => getUserTrips(userId),
  })
}
