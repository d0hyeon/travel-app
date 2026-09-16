import SearchIcon from '@mui/icons-material/Search'
import { Button, Divider, InputAdornment, Stack, TextField } from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { TransportScheduleFields } from './TransportScheduleFields'
import { useFlightSearchOverlay } from './useFlightSearchOverlay'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
  const isMobile = useIsMobile()
  const flightSearch = useFlightSearchOverlay()
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

  // 조회 결과를 폼이 직접 받는다. 밖에서 defaultValues 로 밀어넣으면
  // 이미 마운트된 입력의 표시값이 갱신되지 않는다.
  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const searchFlight = async () => {
    const flight = await flightSearch.open()
    if (flight == null) return

    setValue('departureName', flight.origin.name, { shouldValidate: true })
    setValue('arrivalName', flight.destination.name, { shouldValidate: true })
    setValue('departureAt', flight.scheduled_out, { shouldValidate: true })
    setValue('arrivalAt', flight.scheduled_in, { shouldValidate: true })
    // 항공편 조회는 IANA 타임존을 준다. 좌표에서 알아낼 필요가 없다.
    setValue('departureTimezone', flight.origin.timezone, { shouldValidate: true })
    setValue('arrivalTimezone', flight.destination.timezone, { shouldValidate: true })
    setValue('airline', flight.operatorName, { shouldValidate: true })
    setValue('flightNumber', flight.ident_iata, { shouldValidate: true })
  }

  // 조회로 채웠으면 무엇을 골랐는지 검색 필드에 남긴다.
  const airline = useWatch({ control, name: 'airline' })
  const flightNumber = useWatch({ control, name: 'flightNumber' })
  const selectedFlightLabel = [airline, flightNumber].filter(Boolean).join(' ')

  return (
    <Stack component="form" onSubmit={handleSubmit(onNext)} p={2} gap={2}>
      <TextField
        label="항공사 또는 편명 검색"
        placeholder="예: KE721, 대한항공"
        helperText="조회 없이도 아래에서 직접 입력해 등록할 수 있어요"
        value={selectedFlightLabel}
        onClick={searchFlight}
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

      <Divider />

      <TransportScheduleFields
        control={control}
        departurePlaceholder="출발 공항"
        arrivalPlaceholder="도착 공항"
      />

      <Stack direction={isMobile ? 'column' : 'row'} gap={2}>
        <Controller
          control={control}
          name="airline"
          render={({ field }) => (
            <TextField label="항공사" fullWidth {...field} value={field.value ?? ''} />
          )}
        />
        <Controller
          control={control}
          name="flightNumber"
          render={({ field }) => (
            <TextField label="편명" fullWidth {...field} value={field.value ?? ''} />
          )}
        />
      </Stack>

      <Button type="submit" variant="contained" size="large" disabled={!isValid} sx={{ mt: 1 }}>
        다음
      </Button>
    </Stack>
  )
}
