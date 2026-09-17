import { Button, Divider, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { AirlineField } from './AirlineField'
import { FlightRouteFields } from './FlightRouteFields'
import { TransportTimeFields } from './TransportTimeFields'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
  const isMobile = useIsMobile()
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm<TransportFormValues>({
    values: defaultValues as TransportFormValues,
    // isValid 는 검증이 돈 뒤에만 참이 된다. 제출 시점에만 검증하면
    // 다 채워도 버튼이 계속 잠긴다.
    mode: 'onChange',
  })

  return (
    <Stack component="form" onSubmit={handleSubmit(onNext)} p={2} gap={2}>
      <FlightRouteFields control={control} setValue={setValue} />
      <TransportTimeFields control={control} />

      <Divider />

      <Stack direction={isMobile ? 'column' : 'row'} gap={2}>
        <AirlineField control={control} setValue={setValue} />
        <Controller
          control={control}
          name="flightNumber"
          render={({ field }) => (
            <TextField
              label="편번호"
              placeholder="예: 721"
              fullWidth
              {...field}
              value={field.value ?? ''}
            />
          )}
        />
      </Stack>

      <Button type="submit" variant="contained" size="large" disabled={!isValid} sx={{ mt: 1 }}>
        다음
      </Button>
    </Stack>
  )
}
