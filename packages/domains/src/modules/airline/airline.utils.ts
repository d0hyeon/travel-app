import { AIRLINES } from './airline.data'
import type { Airline } from './airline.types'

function normalize(value: string) {
  return value.toLowerCase().replace(/\s/g, '')
}

function toSearchText(airline: Airline) {
  return [airline.code, airline.nameKo, airline.nameEn].map(normalize).join(' ')
}

export function findAirline(code: string): Airline | undefined {
  return AIRLINES.find((airline) => airline.code === code)
}

export function searchAirlines(keyword: string): Airline[] {
  const normalized = normalize(keyword)
  if (normalized === '') return [...AIRLINES]

  return AIRLINES.filter((airline) => toSearchText(airline).includes(normalized))
}
