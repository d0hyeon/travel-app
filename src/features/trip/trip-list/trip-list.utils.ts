export type TripStatus = 'ongoing' | 'upcoming' | 'past'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDate(iso: string): Date {
  return new Date(iso)
}

export function getTripStatus(startDate: string, endDate: string): TripStatus {
  const now = startOfToday()
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  end.setHours(23, 59, 59, 999)
  if (now >= start && now <= end) return 'ongoing'
  if (now < start) return 'upcoming'
  return 'past'
}

export function getDaysUntil(startDate: string): number {
  return Math.round((parseDate(startDate).getTime() - startOfToday().getTime()) / 86_400_000)
}

export function getTripProgress(startDate: string, endDate: string): number {
  const start = parseDate(startDate).getTime()
  const end = parseDate(endDate).getTime()
  const now = Date.now()
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
}

export function getTripDuration(startDate: string, endDate: string): { nights: number; days: number } {
  const nights = Math.max(
    0,
    Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86_400_000),
  )
  return { nights, days: nights + 1 }
}

export function formatTripDate(iso: string): string {
  return iso.slice(2).replace(/-/g, '.')
}

export function getTripYear(iso: string): string {
  return iso.slice(0, 4)
}

// ─── proximity (UpcomingCard 배경/테두리 보간) ────────────────────────────────

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
