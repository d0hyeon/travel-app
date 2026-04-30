import { Map, type MapBounds, type MarkerProps } from "~shared/components/Map";
import { useRecommendedPlaces } from "./useRecommendedPlaces";
import { isInMapBounds } from "~shared/components/Map/map.utils";
import { Suspense } from "react";
import type { RecommendedPlace } from "./trip-recommend.api";

interface Props extends Pick<MarkerProps, 'color' | 'opacity' | 'outlined'> {
  tripId: string
  bounds?: MapBounds;
  onClick?: (place: RecommendedPlace) => void
}

export function RecommendedMarkers(props: Props) {
  return (
    <Suspense>
      <Resolved {...props} />
    </Suspense>
  )
}

export function Resolved({
  tripId,
  bounds,
  onClick,
  ...props
}: Props) {
  const { data: recommended } = useRecommendedPlaces(tripId)
  const visiblePlaces = bounds
    ? recommended.filter(place => isInMapBounds(place.lat, place.lng, bounds))
    : recommended

  return (
    <>
      {visiblePlaces.map(place => {
        const thumbnailUrl = place.photos[0]

        return (
          <Map.Marker
            key={`rec-${place.id}`}
            lat={place.lat}
            lng={place.lng}
            label={place.recommendLabel}
            variant="circle"
            color="#EB5757"
            opacity={0.8}
            outlined={!thumbnailUrl}
            thumbnailUrl={thumbnailUrl}
            tooltip={[place.recommendLabel, place.name]}
            onClick={() => onClick?.(place)}
            {...props}
          />
        )
      })}
    </>
  )
}
