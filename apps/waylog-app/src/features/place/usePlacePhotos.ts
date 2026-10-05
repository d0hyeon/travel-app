import { useSuspenseQuery } from '@waylog/react'
import { getPhotosByPlaceId, photoKey } from '@waylog/domains/modules/photo'

export function usePlacePhotos(placeId: string) {
  return useSuspenseQuery({
    queryKey: [photoKey, 'place', placeId],
    queryFn: () => getPhotosByPlaceId(placeId),
  })
}
