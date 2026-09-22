import { Button } from '@mui/material'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useState } from 'react'
import {
  TransportFormBody,
  TransportFormFooter,
} from '../transport-form-funnel/TransportFormFunnelLayout.desktop'
import type { TransportTicketDraft } from '../transport-form-funnel/transportForm.types'
import { TransportTicketForm } from './TransportTicketForm'

interface Props {
  tripId: string
  type: TripTransportType
  isSubmitting: boolean
  onSkip: () => void
  onSubmit: (tickets: TransportTicketDraft[]) => void
}

export function TransportTicketStepDesktop({ tripId, type, isSubmitting, onSkip, onSubmit }: Props) {
  const [tickets, setTickets] = useState<TransportTicketDraft[]>([])

  return (
    <>
      <TransportFormBody>
        <TransportTicketForm tripId={tripId} type={type} showIntro onChange={setTickets} />
      </TransportFormBody>

      <TransportFormFooter>
        <Button color="inherit" disabled={isSubmitting} onClick={onSkip}>
          건너뛰기
        </Button>
        <Button variant="contained" loading={isSubmitting} onClick={() => onSubmit(tickets)}>
          완료
        </Button>
      </TransportFormFooter>
    </>
  )
}
