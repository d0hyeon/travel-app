import { formatDisplayDate } from '../utils'

// 오늘이 여행 기간 안이면 오늘, 아니면 시작일을 기본 날짜로 쓴다.
// 웹·앱이 각자 저장소(쿼리 파라미터)를 쓰므로 계산만 공유한다.
export function getDefaultTripDay(
  trip: { startDate: string; endDate: string },
  today: string,
): string {
  const isOngoing = today >= trip.startDate && today <= trip.endDate

  return formatDisplayDate(isOngoing ? today : trip.startDate)
}
