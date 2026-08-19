import type { ComponentProps } from "react";
import { Map } from "~shared/components/Map";
import { isOverseasByCoordinate } from "@waylog/domains/utils";
import { usePlace } from "./usePlace";

interface Props extends Omit<ComponentProps<typeof Map>, 'center' | 'type'> {
  placeId: string;
}

export function PlaceMap({ placeId, ...props }: Props) {
  const { data: place } = usePlace(placeId);


  return (
    <Map
      type={isOverseasByCoordinate(place.lat, place.lng) ? 'google' : "kakao"}
      center={{ lat: place.lat, lng: place.lng }} {...props}
    >
      <Map.Marker lat={place.lat} lng={place.lng} label={place.name} />
    </Map>
  )
}