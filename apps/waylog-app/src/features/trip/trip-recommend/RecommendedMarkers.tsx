import { useRecommendedPlaces } from '@waylog/domains/modules/trip-recommend'
import type { RecommendedPlace } from '@waylog/domains/modules/trip-recommend'
import { Suspense } from 'react'
import { Map, type MarkerProps } from '../../../shared/components/Map'

interface Props extends Pick<MarkerProps, 'color' | 'opacity' | 'outlined'> {
  tripId: string
  onClick?: (place: RecommendedPlace) => void
}

export function RecommendedMarkers(props: Props) {
  return (
    <Suspense>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, onClick, ...props }: Props) {
  const { data: recommended } = useRecommendedPlaces(tripId)

  return (
    <>
      {recommended.map((place) => {
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
