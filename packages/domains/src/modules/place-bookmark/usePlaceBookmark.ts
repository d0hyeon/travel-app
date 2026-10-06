import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '../../gateways/auth'
import {
  addPlaceBookmark,
  getBookmarkedPlaces,
  placeBookmarkKey,
  removePlaceBookmark,
} from './placeBookmark.api'

export function useBookmarkedPlaces() {
  const { data: auth } = useAuth({ required: false })

  return useSuspenseQuery({
    queryKey: [placeBookmarkKey, auth?.id],
    queryFn: getBookmarkedPlaces,
  })
}

export function usePlaceBookmark(placeId: string) {
  const queryClient = useQueryClient()
  const { data: bookmarkedPlaces } = useBookmarkedPlaces()
  const isBookmarked = bookmarkedPlaces.some((place) => place.id === placeId)

  const mutation = useMutation({
    mutationFn: () => (isBookmarked ? removePlaceBookmark(placeId) : addPlaceBookmark(placeId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [placeBookmarkKey] }),
  })

  return { isBookmarked, toggle: mutation.mutateAsync }
}
