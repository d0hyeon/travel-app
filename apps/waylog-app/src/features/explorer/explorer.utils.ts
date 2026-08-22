export type ExplorerFilterVisibility = 'visible' | 'hidden'

export function buildExplorerPlaceDetailPath(placeId: string): string {
  return `/explorer/${encodeURIComponent(placeId)}`
}

export function getExplorerFilterVisibility(
  currentOffset: number,
  previousOffset: number,
): ExplorerFilterVisibility {
  'worklet'

  if (currentOffset <= 0) return 'visible'
  return currentOffset > previousOffset ? 'hidden' : 'visible'
}
