const HOUR_MS = 60 * 60 * 1000

export const OBSERVE_BEFORE_DEPARTURE_HOURS = 24 * 7
export const OBSERVE_AFTER_DEPARTURE_HOURS = 6
export const NOTIFY_BEFORE_DEPARTURE_HOURS = 24

export function getObserveRange(now: Date) {
  return {
    from: new Date(now.getTime() - OBSERVE_AFTER_DEPARTURE_HOURS * HOUR_MS),
    until: new Date(now.getTime() + OBSERVE_BEFORE_DEPARTURE_HOURS * HOUR_MS),
  }
}

export function getIsWithinNotifyWindow(departureAt: string, now: Date, windowHours: number) {
  const departure = new Date(departureAt).getTime()
  const windowEnd = now.getTime() + windowHours * HOUR_MS

  return departure >= now.getTime() && departure <= windowEnd
}
