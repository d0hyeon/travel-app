// UpcomingCard 배경·테두리 보간. rgb()/dashed 같은 CSS 문자열을 반환하므로
// 웹 전용이다. 날짜 계산은 @waylog/domains/trip 으로 옮겼다.

function interpolate(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function upcomingProximityRatio(daysUntil: number): number {
  return Math.min(1, daysUntil / 30)
}

export function upcomingCardBg(daysUntil: number): string {
  const t = upcomingProximityRatio(daysUntil)
  const r = Math.round(interpolate(238, 250, t))
  const g = Math.round(interpolate(243, 250, t))
  const b = Math.round(interpolate(255, 250, t))
  return `rgb(${r},${g},${b})`
}

export function upcomingCardBorderColor(daysUntil: number): string {
  const t = upcomingProximityRatio(daysUntil)
  const r = Math.round(interpolate(76, 0, t))
  const g = Math.round(interpolate(132, 0, t))
  const b = Math.round(interpolate(255, 0, t))
  const a = interpolate(0.25, 0.08, t)
  return `rgba(${r},${g},${b},${a.toFixed(2)})`
}

export function upcomingCardBorderStyle(daysUntil: number): string {
  if (daysUntil <= 3) return 'solid'
  if (daysUntil <= 10) return 'dashed'
  return 'dotted'
}
