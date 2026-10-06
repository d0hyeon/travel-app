import type { UserProfile } from "../user-profile"

export const LEFT_MEMBER_NAME = '탈퇴한 유저'

export interface TripMemberUser {
  id: string
  name: string
  avatarUrl: string | null
}

export interface TripMember extends UserProfile {
  tripId: string;
  userId: string;
  isHost: boolean;
  hasLeft: boolean;
  joinedAt: string;
}
