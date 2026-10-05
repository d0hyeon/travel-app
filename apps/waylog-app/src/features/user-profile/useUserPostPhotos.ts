import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserPostPhotos } from './user-profile.api'

export function useUserPostPhotos(userId: string) {
  return useSuspenseQuery({
    queryKey: ['posts', 'user-preview', userId],
    queryFn: () => getUserPostPhotos(userId),
  })
}
