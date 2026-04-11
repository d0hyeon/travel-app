export interface TripMemberUser {
  id: string
  name: string
  avatarUrl: string | null
}

export interface TripMember {
  id: string
  tripId: string
  userId: string;
  name: string;
  user: TripMemberUser
  createdAt: string
}
