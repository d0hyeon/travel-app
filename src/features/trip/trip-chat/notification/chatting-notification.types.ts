export const ChattingNotificationEvent = {
  open: 'CHAT_OPEN',
  close: 'CHAT_CLOSE',
} as const

export type ChattingNotificationMessage =
  | { type: typeof ChattingNotificationEvent.open; tripId: string }
  | { type: typeof ChattingNotificationEvent.close; tripId: string }
