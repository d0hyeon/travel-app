import type { Location } from '@waylog/domains/location'
import type { PlaceCategoryType } from '~features/place/place.types'

export function buildExplorerDetailUrl(
  base: string,
  location?: Location | null,
  category?: PlaceCategoryType | null,
) {
  const params = new URLSearchParams()
  params.set('location', location ?? '')
  params.set('category', category ?? '')
  const qs = params.toString()
  
  return qs ? `${base}?${qs}` : base
}
