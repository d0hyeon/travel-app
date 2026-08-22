import type { UserProfile } from "@waylog/domains/modules/user-profile";

export interface ChatMessage {
  id: string;
  tripId: string;
  userId: string;
  profile?: UserProfile;
  userName: string;
  content: string;
  createdAt: string;
}
