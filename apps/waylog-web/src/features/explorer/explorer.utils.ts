import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'

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
