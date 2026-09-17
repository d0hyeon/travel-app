import { TextField } from '@mui/material'
import { Controller, type Control, type UseFormSetValue } from 'react-hook-form'
import { FieldPair, RouteArrow } from './scheduleFieldParts'
import { useAirportSelectOverlay } from './useAirportSelectOverlay'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  control: Control<TransportFormValues>
  setValue: UseFormSetValue<TransportFormValues>
}

const readOnlyStyle = {
  '.MuiInputBase-root': { cursor: 'pointer' },
  input: { cursor: 'pointer' },
}

// 공항을 고르는 일과 그 결과를 폼에 반영하는 일은 항공 여정의 책임이다.
// 밖에서 콜백으로 받으면 호출부마다 setValue 세 줄을 다시 적게 된다.
export function FlightRouteFields({ control, setValue }: Props) {
  const airportSelect = useAirportSelectOverlay()

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

  return (
    <FieldPair label="여정">
      <Controller
        control={control}
        name="departureName"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <TextField
            placeholder="출발 공항"
            error={fieldState.invalid}
            fullWidth
            {...field}
            value={field.value ?? ''}
            onClick={selectDeparture}
            slotProps={{ input: { readOnly: true } }}
            sx={readOnlyStyle}
          />
        )}
      />
      <RouteArrow />
      <Controller
        control={control}
        name="arrivalName"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <TextField
            placeholder="도착 공항"
            error={fieldState.invalid}
            fullWidth
            {...field}
            value={field.value ?? ''}
            onClick={selectArrival}
            slotProps={{ input: { readOnly: true } }}
            sx={readOnlyStyle}
          />
        )}
      />
    </FieldPair>
  )
}
