import { useSuspenseQuery } from '@tanstack/react-query'
import { getPhotosByPlaceId, photoKey } from '@waylog/domains/modules/photo'

export function useExplorerPlacePhotos(placeId: string) {
  return useSuspenseQuery({
    queryKey: [photoKey, 'place', placeId],
    queryFn: () => getPhotosByPlaceId(placeId),
  })
}
