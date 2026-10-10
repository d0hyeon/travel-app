import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '../../gateways/auth'
import {
  addPlaceBookmark,
  getBookmarkedPlaceIds,
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
  const { data: auth } = useAuth({ required: false })
  const queryClient = useQueryClient()
  const queryKey = usePlaceBookmark.key(auth?.id)
  const { data: bookmarkedPlaceIds } = useSuspenseQuery({
    queryKey,
    queryFn: getBookmarkedPlaceIds,
  })
  const isBookmarked = bookmarkedPlaceIds.includes(placeId)

  const mutation = useMutation({
    mutationFn: () => (isBookmarked ? removePlaceBookmark(placeId) : addPlaceBookmark(placeId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previousPlaceIds = queryClient.getQueryData<string[]>(queryKey)
      queryClient.setQueryData<string[]>(queryKey, (placeIds = []) =>
        isBookmarked ? placeIds.filter((id) => id !== placeId) : [placeId, ...placeIds],
      )
      return { previousPlaceIds }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousPlaceIds)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [placeBookmarkKey] })
    },
  })

  return { isBookmarked, toggle: Object.assign(mutation.mutateAsync, mutation) }
}

usePlaceBookmark.key = (userId?: string) => [placeBookmarkKey, 'place-ids', userId]
