import type { TripMember } from './tripMember.types'

function compareIds(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function findHostSuccessor(members: TripMember[]): TripMember | undefined {
  return members
    .filter((member) => !member.isHost && !member.hasLeft)
    .toSorted((a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt) || compareIds(a.id, b.id))
    .at(0)
}
