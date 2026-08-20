import { set } from "date-fns"
import type { Trip } from "./trip.types"

export type TripStatus = 'ongoing' | 'upcoming' | 'past'

function resetTimes(date: Date | number) {
  return set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
}

function startOfToday(): Date {
  return resetTimes(Date.now())
}

// new Date('YYYY-MM-DD')는 date-only 문자열을 UTC 자정으로 해석하므로
// 음수 UTC 오프셋 타임존에서는 로컬 날짜가 하루 당겨진다. 연/월/일을 직접 조합해 로컬 자정으로 만든다.
function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
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
  const end = parseDate(endDate)
  end.setHours(23, 59, 59, 999)
  const now = Date.now()
  return Math.min(100, Math.max(0, ((now - start) / (end.getTime() - start)) * 100))
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

// 웹 TripListPage 의 useMemo 안에 있던 분류·정렬을 순수 함수로 분리한다.
// 앱과 웹이 같은 규칙을 쓴다.
export function groupTripsByStatus(trips: Trip[]): Record<TripStatus, Trip[]> {
  const groups: Record<TripStatus, Trip[]> = { ongoing: [], upcoming: [], past: [] }

  for (const trip of trips) {
    groups[getTripStatus(trip.startDate, trip.endDate)].push(trip)
  }

  // 다가오는 순서. 진행 중·예정은 먼저 시작한 여행이 앞이다.
  const startsEarlierFirst = (a: Trip, b: Trip) => a.startDate.localeCompare(b.startDate)
  // 최근에 끝난 여행이 앞이다.
  const endsLaterFirst = (a: Trip, b: Trip) => b.endDate.localeCompare(a.endDate)

  return {
    ongoing: groups.ongoing.toSorted(startsEarlierFirst),
    upcoming: groups.upcoming.toSorted(startsEarlierFirst),
    past: groups.past.toSorted(endsLaterFirst),
  }
}
