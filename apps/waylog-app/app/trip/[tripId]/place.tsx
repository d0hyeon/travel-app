import { Map } from '../../../src/shared/components/Map'

export default function TripDetailPlaceRoute() {
  return (
    <Map defaultCenter={{ lat: 37.5665, lng: 126.978 }}>
      <Map.Marker lat={37.5665} lng={126.978} label="서울시청" />
    </Map>
  )
}
