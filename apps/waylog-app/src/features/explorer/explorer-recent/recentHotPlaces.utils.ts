import type { ExploredPlace } from "~features/explorer/explorer.api";

export function byHotRank(first: ExploredPlace, second: ExploredPlace) {
  const scoreGap = second.score - first.score;
  if (scoreGap !== 0) return scoreGap;

  if (!first.lastSavedAt || !second.lastSavedAt) return 0;

  return second.lastSavedAt.localeCompare(first.lastSavedAt);
}
