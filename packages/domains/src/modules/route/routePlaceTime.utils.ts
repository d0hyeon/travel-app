import type { Json } from '../../gateways/client'
import type { RoutePlaceTime } from './route.types'

export const EMPTY_ROUTE_PLACE_TIME: RoutePlaceTime = { startTime: null, endTime: null }

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

function isTimeText(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value)
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizePlaceTimes(placeTimes: Json | undefined): Record<string, RoutePlaceTime> {
  if (!isRecord(placeTimes)) return {}

  return Object.entries(placeTimes).reduce<Record<string, RoutePlaceTime>>((normalized, [placeId, time]) => {
    if (!isRecord(time)) return normalized

    normalized[placeId] = {
      startTime: isTimeText(time.startTime) ? time.startTime : null,
      endTime: isTimeText(time.endTime) ? time.endTime : null,
    }
    return normalized
  }, {})
}

export function isValidRoutePlaceTime({ startTime, endTime }: RoutePlaceTime) {
  const isStartFormatted = startTime == null || isTimeText(startTime)
  const isEndFormatted = endTime == null || isTimeText(endTime)
  if (!isStartFormatted || !isEndFormatted) return false

  if (startTime == null || endTime == null) return true
  return toMinutes(endTime) > toMinutes(startTime)
}

export function getRoutePlaceTimeMinutes({ startTime, endTime }: RoutePlaceTime) {
  if (startTime == null || endTime == null) return null
  return toMinutes(endTime) - toMinutes(startTime)
}

export function formatRoutePlaceTime({ startTime, endTime }: RoutePlaceTime) {
  if (startTime != null && endTime != null) return `${startTime}–${endTime}`
  if (startTime != null) return startTime
  if (endTime != null) return `~${endTime}`
  return null
}
