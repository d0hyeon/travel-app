export interface TripMember {
  id: string
  tripId: string
  userId: string
  /** user_profiles에서 조회 */
  name: string
  /** user_profiles에서 조회 */
  avatarUrl: string | null
  createdAt: string
}

export const PROFILE_EMOJIS = [
  '😀', '😎', '🥳', '😇', '🤩', '🥹', '😊', '🤗',
  '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁',
  '🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🍀', '🌿',
  '⭐', '🌙', '☀️', '🌈', '❤️', '💜', '💙', '💚'
] as const

export function getRandomEmoji(): string {
  return PROFILE_EMOJIS[Math.floor(Math.random() * PROFILE_EMOJIS.length)]
}
