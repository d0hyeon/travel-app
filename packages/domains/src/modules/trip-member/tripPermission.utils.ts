import type { TripMember } from './tripMember.types'
import { TripPermission, type TripRole } from './tripPermission.types'

const ROLE_PERMISSIONS = {
  host: [TripPermission.삭제, TripPermission.초대],
  member: [TripPermission.탈퇴],
} satisfies Record<TripRole, readonly TripPermission[]>

export function getTripRole(members: TripMember[], userId: string): TripRole | undefined {
  const me = members.find((member) => member.userId === userId)
  if (me == null) return undefined
  return me.isHost ? 'host' : 'member'
}

export function hasTripPermission(role: TripRole, permission: TripPermission): boolean {
  const grantedPermissions: readonly TripPermission[] = ROLE_PERMISSIONS[role]
  return grantedPermissions.includes(permission)
}
