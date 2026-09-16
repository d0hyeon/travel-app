import SearchIcon from '@mui/icons-material/Search'
import { Button, Divider, InputAdornment, Stack, TextField } from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { TransportScheduleFields } from './TransportScheduleFields'
import { useAirlineSelectOverlay } from './useAirlineSelectOverlay'
import { useAirportSelectOverlay } from './useAirportSelectOverlay'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
  const isMobile = useIsMobile()
  const airportSelect = useAirportSelectOverlay()
  const airlineSelect = useAirlineSelectOverlay()
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

  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const selectDeparture = async () => {
    const airport = await airportSelect.open('출발 공항 선택')
    if (airport == null) return

    setValue('departureName', airport.nameKo, { shouldValidate: true })
    setValue('departureAirportCode', airport.code, { shouldValidate: true })
    setValue('departureTimezone', airport.timezone, { shouldValidate: true })
  }

  const selectArrival = async () => {
    const airport = await airportSelect.open('도착 공항 선택')
    if (airport == null) return

    setValue('arrivalName', airport.nameKo, { shouldValidate: true })
    setValue('arrivalAirportCode', airport.code, { shouldValidate: true })
    setValue('arrivalTimezone', airport.timezone, { shouldValidate: true })
  }

  const selectAirline = async () => {
    const airline = await airlineSelect.open()
    if (airline == null) return

    setValue('airline', airline.nameKo, { shouldValidate: true })
    setValue('airlineCode', airline.code, { shouldValidate: true })
  }

  const airline = useWatch({ control, name: 'airline' })

  return (
    <Stack component="form" onSubmit={handleSubmit(onNext)} p={2} gap={2}>
      <TransportScheduleFields
        control={control}
        departurePlaceholder="출발 공항"
        arrivalPlaceholder="도착 공항"
        onDepartureClick={selectDeparture}
        onArrivalClick={selectArrival}
      />

      <Divider />

      <Stack direction={isMobile ? 'column' : 'row'} gap={2}>
        <TextField
          label="항공사"
          placeholder="목록에서 선택"
          value={airline ?? ''}
          onClick={selectAirline}
          fullWidth
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ '.MuiInputBase-root': { cursor: 'pointer' }, input: { cursor: 'pointer' } }}
        />
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
