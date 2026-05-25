import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'

export function buildExplorerDetailUrl(
  base: string,
  location?: Location | null,
  category?: PlaceCategoryType | null,
) {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (category) params.set('category', category)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
