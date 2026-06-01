import type { UserProfile } from "~features/user-profile/user-profile.type";

export interface ChatMessage {
  id: string;
  tripId: string;
  userId: string;
  profile?: UserProfile;
  content: string;
  createdAt: string;
}
