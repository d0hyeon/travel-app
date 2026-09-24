export type ExplorerFilterVisibility = 'visible' | 'hidden'

export function getExplorerFilterVisibility(
  currentOffset: number,
  previousOffset: number,
): ExplorerFilterVisibility {
  'worklet'

  if (currentOffset <= 0) return 'visible'
  return currentOffset > previousOffset ? 'hidden' : 'visible'
}
