export interface TripMember {
  id: string
  tripId: string
  name: string
  emoji: string
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
