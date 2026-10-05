import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import type { ExplorerFilterParams } from './explorerFilterParams'

export function buildExplorerDetailParams(
  location?: Location,
  category?: PlaceCategoryType,
): ExplorerFilterParams {
  return { location: location ?? '', category: category ?? '' }
}

export type ExplorerFilterVisibility = 'visible' | 'hidden'

export function getExplorerFilterVisibility(
  currentOffset: number,
  previousOffset: number,
): ExplorerFilterVisibility {
  'worklet'

  if (currentOffset <= 0) return 'visible'
  return currentOffset > previousOffset ? 'hidden' : 'visible'
}
