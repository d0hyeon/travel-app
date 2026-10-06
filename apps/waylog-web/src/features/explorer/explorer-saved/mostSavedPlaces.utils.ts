import type { MostSavedPlace } from '../explorer.api'

export function bySaveRank(first: MostSavedPlace, second: MostSavedPlace) {
  const saveCountGap = second.saveCount - first.saveCount
  if (saveCountGap !== 0) return saveCountGap

  if (!first.lastSavedAt || !second.lastSavedAt) return 0

  return second.lastSavedAt.localeCompare(first.lastSavedAt)
}
