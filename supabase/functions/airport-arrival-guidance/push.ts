export interface AirportArrivalGuidanceForPush {
  recommendedArrivalAt: string
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

/** 화면과 같은 문구를 쓴다. 다른 문구를 쓰면 알림과 상세 화면이 서로 다른 시각을 말한다. */
export function toAirportArrivalPushMessage(
  guidance: AirportArrivalGuidanceForPush,
): AirportArrivalPushMessage {
  const clock = CLOCK_FORMAT.format(new Date(guidance.recommendedArrivalAt))

  return {
    title: '공항 도착 안내',
    body: `${clock}까지 공항 도착을 권장해요`,
  }
}
