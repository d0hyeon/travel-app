import { getCarrierInfo, type TripTransport } from '@waylog/domains/modules/trip-transport'

export function toCarrierLabel(transport: TripTransport): string | undefined {
  const { name, number } = getCarrierInfo(transport)
  const label = [name, number].filter(Boolean).join(' · ')

  return label === '' ? undefined : label
}
