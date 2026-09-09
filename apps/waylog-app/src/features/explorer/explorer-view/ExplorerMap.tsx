import { useRouter } from 'expo-router'
import { getCoordinateByLocation, type Location } from '@waylog/domains/modules/location'
import { StyleSheet, View } from 'react-native'
import { Map } from '../../../shared/components/Map'
import { Typography } from '~/shared/components/design-system'
import { buildExplorerPlaceDetailPath } from '../explorer.utils'

interface ExplorerMapPlace {
  placeId: string
  name: string
  lat: number
  lng: number
  thumbnailUrl?: string
}

interface Props {
  places: ExplorerMapPlace[]
  location?: Location
}

export function ExplorerMap({ places, location }: Props) {
  const router = useRouter()
  const defaultCenter = location == null ? undefined : getCoordinateByLocation(location)

  return (
    <View style={styles.map}>
      <Map defaultCenter={defaultCenter} autoFocus="marker" clustering clusterGridSize={60}>
        {places.map((place) => (
          <Map.Marker
            key={place.placeId}
            id={place.placeId}
            lat={place.lat}
            lng={place.lng}
            label={place.name}
            thumbnailUrl={place.thumbnailUrl}
            onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
          />
        ))}
      </Map>
      <View pointerEvents="none" style={styles.emptyNotice}>
        <Typography variant="caption" color="text.secondary">마커를 누르면 장소 정보를 볼 수 있어요</Typography>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  emptyNotice: { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
})
