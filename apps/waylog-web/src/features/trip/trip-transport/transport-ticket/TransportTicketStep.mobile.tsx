import { Button, Stack } from '@mui/material'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useState } from 'react'
import { BottomArea } from '~shared/components/BottomArea'
import type { TransportTicketDraft } from '../transport-form-funnel/transportForm.types'
import { TransportTicketForm } from './TransportTicketForm'

interface Props {
  tripId: string
  type: TripTransportType
  isSubmitting: boolean
  onSkip: () => void
  onSubmit: (tickets: TransportTicketDraft[]) => void
}

export function TransportTicketStepMobile({ tripId, type, isSubmitting, onSkip, onSubmit }: Props) {
  const [tickets, setTickets] = useState<TransportTicketDraft[]>([])

  return (
    <>
      <Stack p={2} pb={9}>
        <TransportTicketForm tripId={tripId} type={type} showIntro onChange={setTickets} />
      </Stack>

      <BottomArea left={0}>
        <Button color="inherit" disabled={isSubmitting} onClick={onSkip}>
          건너뛰기
        </Button>
        <Button
          fullWidth
          variant="contained"
          size="large"
          loading={isSubmitting}
          onClick={() => onSubmit(tickets)}
        >
          완료
        </Button>
      </BottomArea>
    </>
  )
}
