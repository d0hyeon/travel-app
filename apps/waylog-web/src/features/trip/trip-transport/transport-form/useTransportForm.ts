import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useState } from 'react'
import type { TransportFormValues } from './transportForm.types'

export function useTransportForm() {
  const [type, selectType] = useState<TripTransportType>()
  const [detail, saveDetail] = useState<TransportFormValues>()

  return { type, detail, selectType, saveDetail }
}
