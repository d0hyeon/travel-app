import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserProfileById, userProfileKey } from './user-profile.api'

export function useUserProfile(id: string) {
  return useSuspenseQuery({
    queryKey: [userProfileKey, id],
    queryFn: () => getUserProfileById(id),
  })
}
