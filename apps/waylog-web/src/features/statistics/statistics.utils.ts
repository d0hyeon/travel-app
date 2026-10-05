const MAX_LABEL_NAMES = 3

export interface RankedGroup {
  rank: number
  names: string[]
  tripCount: number
  share: number
  overflow: number
}

export function groupByTripCount(
  items: { name: string; tripCount: number; share: number }[],
): RankedGroup[] {
  const groups: RankedGroup[] = []
  let rank = 1

  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.tripCount === item.tripCount) {
      last.names.push(item.name)
      last.overflow = Math.max(0, last.names.length - MAX_LABEL_NAMES)
    } else {
      groups.push({ rank, names: [item.name], tripCount: item.tripCount, share: item.share, overflow: 0 })
    }
    rank++
  }

  return groups
}

export function formatGroupLabel(group: RankedGroup): string {
  const visible = group.names.slice(0, MAX_LABEL_NAMES).join(', ')
  return group.overflow > 0 ? `${visible} 외 ${group.overflow}개` : visible
}

export function formatGroupTooltip(group: RankedGroup): string | undefined {
  if (group.overflow === 0) return undefined
  return group.names.join(', ')
}
