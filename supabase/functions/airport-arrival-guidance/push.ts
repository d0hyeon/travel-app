export type AirportCongestionTierForPush = 'calm' | 'normal' | 'crowded' | 'veryCrowded'

export interface AirportArrivalGuidanceForPush {
  recommendedArrivalAt: string
  congestionTier: AirportCongestionTierForPush
}

export interface AirportArrivalPushMessage {
  title: string
  body: string
}

const CLOCK_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

const BODY_BY_TIER: Record<AirportCongestionTierForPush, (clock: string) => string> = {
  calm: (clock) => `공항이 여유로울 것으로 예상돼요. ${clock}까지 공항에 도착하는 것을 권장해요.`,
  normal: (clock) => `여유로운 탑승을 위해 ${clock}까지 공항에 도착하는 걸 권장해요.`,
  crowded: (clock) => `공항이 혼잡할 것으로 예상돼요. ${clock}까지 공항에 도착하는 것을 권장해요.`,
  veryCrowded: (clock) => `공항이 매우 혼잡할 것으로 예상돼요. 서둘러 ${clock}까지 도착해 주세요.`,
}

export function toAirportArrivalPushMessage(
  guidance: AirportArrivalGuidanceForPush,
): AirportArrivalPushMessage {
  const clock = CLOCK_FORMAT.format(new Date(guidance.recommendedArrivalAt))

  return {
    title: '드디어 내일, 설레는 여행이 시작돼요!',
    body: BODY_BY_TIER[guidance.congestionTier](clock),
  }
}
