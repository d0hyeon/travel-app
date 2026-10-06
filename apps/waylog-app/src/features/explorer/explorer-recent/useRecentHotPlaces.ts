import { useSuspenseQuery } from "@tanstack/react-query";
import type { Location } from "@waylog/domains/modules/location";
import type { PlaceCategoryType } from "@waylog/domains/modules/place";
import { useMemo } from "react";
import { explorerKey, getExploredPlaces } from "~features/explorer/explorer.api";
import { byHotRank } from "./recentHotPlaces.utils";

interface PlaceFilters {
  location?: Location;
  category?: PlaceCategoryType;
}

export function useRecentHotPlaces(months: number, filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, "recent-hot", months, filters.location, filters.category],
    queryFn: () => getExploredPlaces(filters, getSinceDate(months)),
  });

  const places = useMemo(() => {
    const highestScore = Math.max(...query.data.map((place) => place.score), 0);
    const minimumScore = highestScore / 2;
    return query.data
      .toSorted(byHotRank)
      .filter((place) => place.score >= minimumScore);
  }, [query.data]);

  return { ...query, data: places };
}

function getSinceDate(months: number): string {
  const sinceDate = new Date();
  sinceDate.setMonth(sinceDate.getMonth() - months);
  return sinceDate.toISOString().split("T")[0] ?? "";
}
