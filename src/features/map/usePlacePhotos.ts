import { useSuspenseQuery } from "@tanstack/react-query"
import { getPhotosByPlaceId, photoKey } from "../photo/photo.api"

export function usePlacePhotos(placeId: string) {
  return useSuspenseQuery({
    queryKey: [photoKey, 'place', placeId],
    queryFn: () => getPhotosByPlaceId(placeId),
  })
}
