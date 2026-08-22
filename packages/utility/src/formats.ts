import { format } from 'date-fns'

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
export function formatDisplayDate(value: string | number | Date) { return format(value, 'yyyy-MM-dd') }
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 1) return '1분 미만'
  const hours = Math.floor(totalMinutes / 60), minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}분`
  if (minutes === 0) return `${hours}시간`
  return `${hours}시간 ${minutes}분`
}
export function formatDistance(meters: number): string { return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km` }
const SECOND = 1000, MINUTE = SECOND * 60, HOUR = MINUTE * 60, DAY = HOUR * 24
export function formatRemainTime(base: string | number, template: string, textInMinute = '방금 전') {
  const diff = new Date(base).getTime() - Date.now()
  if (diff >= DAY) { const days = Math.floor(diff / DAY), hours = Math.floor((diff % DAY) / HOUR); return template.replace('#', hours > 0 ? `${days}일 ${hours}시간` : `${days}일`) }
  if (diff >= HOUR) { const hours = Math.floor(diff / HOUR), minutes = Math.floor((diff % HOUR) / MINUTE); return template.replace('#', minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`) }
  if (diff >= MINUTE) return template.replace('#', `${Math.floor(diff / MINUTE)}분`)
  return textInMinute
}
export function formatKoreanCount(value: number): string { const magnitude = Math.abs(value), sign = value < 0 ? '-' : ''; return magnitude < 10_000 ? `${sign}${magnitude.toLocaleString('ko-KR')}` : `${sign}${Math.round(magnitude / 10_000).toLocaleString('ko-KR')}만` }
