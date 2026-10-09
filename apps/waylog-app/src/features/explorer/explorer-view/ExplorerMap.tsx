import { getCoordinateByLocation, type Location } from '@waylog/domains/modules/location'
import { StyleSheet, View } from 'react-native'
import { Map } from '~shared/components/Map'
import { Typography } from '~shared/components/design-system'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'

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
  const navigation = useAppNavigation()
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
            onPress={() => navigation.navigate(AppRoute.장소_상세, { placeId: place.placeId })}
          />
        ))}
      </Map>
    </View>
  )
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  emptyNotice: { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
})
