import { useSuspenseQuery } from "@waylog/react";
import { getFeedByPlace } from "./placeFeed.api";
import { usePlace } from "../../place/usePlace";

export function usePlaceFeed(placeId: string) {
  const { data: place } = usePlace(placeId);
  const { data: feed, ...queries } = useSuspenseQuery({
    queryKey: usePlaceFeed.key(placeId),
    queryFn: async () => getFeedByPlace(placeId),
  });

  return { data: { feed, place }, ...queries }
}
usePlaceFeed.key = (placeId: string) => ['place', 'feed', placeId];