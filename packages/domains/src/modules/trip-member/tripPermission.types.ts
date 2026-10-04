export const TripPermission = {
  삭제: "DELETE_TRIP",
  탈퇴: "LEAVE_TRIP",
  초대: "INVITE_MEMBER",
} as const;

export type TripPermission =
  (typeof TripPermission)[keyof typeof TripPermission];

export type TripRole = "host" | "member";
