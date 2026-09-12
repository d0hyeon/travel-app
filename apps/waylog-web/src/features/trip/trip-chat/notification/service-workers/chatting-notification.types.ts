import z from "zod";

  export const ChattingNotificationType = {
  open: 'CHAT_OPEN',
  close: 'CHAT_CLOSE',
  openPanel: 'OPEN_CHAT_PANEL',
} as const

export const ChattingNotificationMessageSchema = z.union([
  z.object({ type: z.literal(ChattingNotificationType.open), tripId: z.string() }),
  z.object({ type: z.literal(ChattingNotificationType.close), tripId: z.string() }),
  z.object({ type: z.literal(ChattingNotificationType.openPanel), tripId: z.string() }),    
])

export type ChattingNotificationMessage = z.infer<typeof ChattingNotificationMessageSchema>

