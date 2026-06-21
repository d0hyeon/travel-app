import { format } from "date-fns";

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatDisplayDate(value: string | number | Date) {
  return format(value, 'yyyy-MM-dd')
}

// 초 단위 소요 시간을 "1시간 25분" / "12분" 형태로 변환한다
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 1) return '1분 미만'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}분`
  if (minutes === 0) return `${hours}시간`
  return `${hours}시간 ${minutes}분`
}

// 미터 단위 거리를 "8.1km" / "350m" 형태로 변환한다
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}



const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const now = new Date();

export function formatRemainTime(
  base: string | number,
  format: string,
  textInMinute: string = '방금 전'
) {
  const target = now;
  const diff = new Date(base).getTime() - target.getTime();

  if (diff >= DAY) {
    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    return format.replace('#', hours > 0 ? `${days}일 ${hours}시간` : `${days}일`);
  }

  if (diff >= HOUR) {
    const hours = Math.floor(diff / HOUR);
    const minutes = Math.floor((diff % HOUR) / MINUTE);
    
    return format.replace('#', minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`);
  }

  if (diff >= MINUTE) {
    return format.replace('#', `${Math.floor(diff / MINUTE)}분`);
  }

  return textInMinute;
}