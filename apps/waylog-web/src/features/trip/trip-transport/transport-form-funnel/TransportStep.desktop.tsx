import { Button } from '@mui/material'
import { TransportType } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { FlightTransportForm } from '~features/transport/FlightTransportForm'
import { TransportForm } from '~features/transport/TransportForm'
import type { TransportFormValues } from '~features/transport/transportForm.types'
import { TransportFormBody, TransportFormFooter } from './TransportFormLayout.desktop'

interface Props {
  type: TripTransportType
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
  onBack: () => void
}

export function TransportStepDesktop({ type, defaultValues, onNext, onBack }: Props) {
  if (type === TransportType.항공) {
    return (
      <>
        <TransportFormBody>
          <FlightTransportForm defaultValues={defaultValues} onNext={onNext} />
        </TransportFormBody>

        <TransportFormFooter>
          <Button color="inherit" onClick={onBack}>
            이전
          </Button>
          <FlightTransportForm.SubmitButton fullWidth={false} />
        </TransportFormFooter>
      </>
    )
  }

  return (
    <>
      <TransportFormBody>
        <TransportForm defaultValues={defaultValues} onNext={onNext} />
      </TransportFormBody>

      <TransportFormFooter>
        <Button color="inherit" onClick={onBack}>
          이전
        </Button>
        <TransportForm.SubmitButton fullWidth={false} />
      </TransportFormFooter>
    </>
  )
}
