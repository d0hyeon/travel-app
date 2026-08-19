import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '~app/query-client'
import { getUserProfileById, userProfileKey } from './user-profile.api'

export function useUserProfile(id: string) {
  return useSuspenseQuery({
    queryKey: useUserProfile.key(id),
    queryFn: () => getUserProfileById(id),
  })
}

useUserProfile.key = (id: string) => [userProfileKey, id]
useUserProfile.prefetch = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: useUserProfile.key(id),
    queryFn: () => getUserProfileById(id),
  })
}
