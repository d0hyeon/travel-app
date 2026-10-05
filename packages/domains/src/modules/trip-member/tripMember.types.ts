import type { UserProfile } from "../user-profile"

export interface TripMemberUser {
  id: string
  name: string
  avatarUrl: string | null
}

export interface TripMember extends UserProfile {
  tripId: string;
  userId: string;
  isHost: boolean;
}
