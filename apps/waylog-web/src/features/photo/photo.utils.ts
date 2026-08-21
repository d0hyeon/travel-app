import { extractGps } from '~shared/utils/exif'
import { findNearestPlace } from '@waylog/domains/trip'

const PLACE_MATCH_DISTANCE_LIMIT = 500

export async function findNearestPlaceFromPhoto(
  file: File,
  places: Array<{ placeId: string; lat: number; lng: number }>
): Promise<string | undefined> {
  const coord = await extractGps(file)
  if (!coord) return undefined

  const nearest = findNearestPlace(coord, places, {
    withinMeters: PLACE_MATCH_DISTANCE_LIMIT,
  })

  return nearest?.placeId
}
