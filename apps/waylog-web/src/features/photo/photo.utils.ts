import { extractGps } from '~shared/utils/exif'
import { calcDistance } from '@waylog/domains/utils'

const PLACE_MATCH_DISTANCE_LIMIT = 500

export async function findNearestPlaceFromPhoto(
  file: File,
  places: Array<{ placeId: string; lat: number; lng: number }>
): Promise<string | undefined> {
  const coord = await extractGps(file)
  if (!coord) return undefined

  const nearest = places
    .map(place => ({ place, distance: calcDistance(coord, place) }))
    .filter(({ distance }) => distance <= PLACE_MATCH_DISTANCE_LIMIT)
    .toSorted((a, b) => a.distance - b.distance)[0]

  return nearest?.place.placeId
}
