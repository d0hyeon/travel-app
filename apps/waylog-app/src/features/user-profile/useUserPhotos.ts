import { useSuspenseQuery } from '@tanstack/react-query'
import { photoKey } from '@waylog/domains/modules/photo'
import { getUserPhotos } from './user-profile.api'

export function useUserPhotos(userId: string) {
  return useSuspenseQuery({
    queryKey: [photoKey, 'by-user', userId],
    queryFn: () => getUserPhotos(userId),
  })
}
