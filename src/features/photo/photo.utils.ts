import exifr from 'exifr'
import type { Place } from '~features/place/place.types'
import { calcDistance } from '~shared/utils/geo'

export interface PhotoExif {
  lat?: number
  lng?: number
  takenAt?: Date
}

const PLACE_MATCH_DISTANCE_LIMIT = 500

export async function extractPhotoExif(file: File): Promise<PhotoExif> {
  try {
    const data = await exifr.parse(file, { gps: true, pick: ['DateTimeOriginal', 'latitude', 'longitude'] })
    if (data == null) return {}

    return {
      lat: data.latitude,
      lng: data.longitude,
      takenAt: data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : undefined,
    }
  } catch {
    return {}
  }
}

export function resolvePhotoPlaceId(
  exif: PhotoExif,
  places: Place[],
  trip: { startDate: string; endDate: string }
): string | undefined {
  const { lat, lng, takenAt } = exif

  if (takenAt == null) return undefined

  const takenDate = takenAt.toISOString().slice(0, 10)
  if (takenDate < trip.startDate || takenDate > trip.endDate) return undefined

  if (lat == null || lng == null) return undefined

  const photo = { lat, lng }
  const nearestPlace = places
    .map(place => ({ place, distance: calcDistance(photo, { lat: place.lat, lng: place.lng }) }))
    .filter(({ distance }) => distance <= PLACE_MATCH_DISTANCE_LIMIT)
    .toSorted((a, b) => a.distance - b.distance)[0]

  return nearestPlace?.place.id
}
