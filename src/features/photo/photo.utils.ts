import exifr from 'exifr'
import { calcDistance } from '~shared/utils/geo'

const PLACE_MATCH_DISTANCE_LIMIT = 500

export async function findNearestPlaceFromPhoto(
  file: File,
  places: Array<{ id: string; lat: number; lng: number }>
): Promise<string | undefined> {
  const exif = await exifr.parse(file, { gps: true, pick: ['latitude', 'longitude'] })
  const { latitude: lat, longitude: lng } = exif ?? {}

  if (lat == null || lng == null) return undefined

  const nearest = places
    .map(place => ({ place, distance: calcDistance({ lat, lng }, place) }))
    .filter(({ distance }) => distance <= PLACE_MATCH_DISTANCE_LIMIT)
    .toSorted((a, b) => a.distance - b.distance)[0]

  return nearest?.place.id
}
