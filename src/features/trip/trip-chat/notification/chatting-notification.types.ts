export const ChattingNotificationEvent = {
  open: 'CHAT_OPEN',
  close: 'CHAT_CLOSE',
  openPanel: 'OPEN_CHAT_PANEL',
} as const

export type ChattingNotificationMessage =
  | { type: typeof ChattingNotificationEvent.open; tripId: string }
  | { type: typeof ChattingNotificationEvent.close; tripId: string }
  | { type: typeof ChattingNotificationEvent.openPanel; tripId: string }
