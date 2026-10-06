import { Stack } from '@mui/material'
import { TransportType } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { BottomArea } from '~shared/components/BottomArea'
import { FlightTransportForm } from '~features/transport/transport-form/FlightTransportForm'
import { TransportForm } from '~features/transport/transport-form/TransportForm'
import type { TransportFormValues } from '~features/transport/transport-form/transportForm.types'

interface Props {
  type: TripTransportType
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function TransportStepMobile({ type, defaultValues, onNext }: Props) {
  if (type === TransportType.항공) {
    return (
      <>
        <Stack p={2} pb={9}>
          <FlightTransportForm defaultValues={defaultValues} onNext={onNext} />
        </Stack>
        <BottomArea left={0}>
          <FlightTransportForm.SubmitButton />
        </BottomArea>
      </>
    )
  }

  return (
    <>
      <Stack p={2} pb={9}>
        <TransportForm defaultValues={defaultValues} onNext={onNext} />
      </Stack>
      <BottomArea left={0}>
        <TransportForm.SubmitButton />
      </BottomArea>
    </>
  )
}
