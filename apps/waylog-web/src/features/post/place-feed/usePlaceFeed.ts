import { useSuspenseQuery } from "@waylog/react";
import { usePlace } from '@waylog/domains/modules/place';
import { getPlaceFeed } from '@waylog/domains/modules/post';

export function usePlaceFeed(placeId: string) {
  const { data: place } = usePlace(placeId);
  const { data: feed, ...queries } = useSuspenseQuery({
    queryKey: usePlaceFeed.key(placeId),
    queryFn: () => getPlaceFeed(placeId),
  });

  return { data: { feed, place }, ...queries }
}
usePlaceFeed.key = (placeId: string) => ['place', 'feed', placeId];
