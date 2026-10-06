
import { getLastReadAt } from '@waylog/domains/modules/trip-chat';

export function buildLastReads(tripIds: string[]): Record<string, string> {
  return tripIds.reduce<Record<string, string>>((lastReads, tripId) => {
    const lastReadAt = getLastReadAt(tripId)
    if (lastReadAt == null || Number.isNaN(Date.parse(lastReadAt))) return lastReads
    return { ...lastReads, [tripId]: lastReadAt }
  }, {})
}

export function increaseUnreadCount(
  unreadCounts: Record<string, number>,
  tripId: string,
): Record<string, number> {
  if (!(tripId in unreadCounts)) return unreadCounts
  return { ...unreadCounts, [tripId]: unreadCounts[tripId] + 1 }
}
