export const TripPermission = {
  탈퇴: "LEAVE_TRIP",
  초대: "INVITE_MEMBER",
} as const;

export type TripPermission =
  (typeof TripPermission)[keyof typeof TripPermission];

export type TripRole = "host" | "member";
