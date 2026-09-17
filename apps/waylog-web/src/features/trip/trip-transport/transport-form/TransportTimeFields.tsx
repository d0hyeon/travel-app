import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, type Control } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { FieldPair, RouteArrow } from './scheduleFieldParts'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  control: Control<TransportFormValues>
}

// 출발·도착 일시는 종류와 무관하게 같다. 두 값 모두 필수다 --
// 하나라도 비면 목록의 "A → B, 09:10 → 10:45" 가 성립하지 않는다.
export function TransportTimeFields({ control }: Props) {
  const isMobile = useIsMobile()
  const pickerSx = isMobile
    ? { '.MuiPickersSectionList-root': { paddingY: 1.5 }, '.MuiFormLabel-root': { lineHeight: 1 } }
    : {}

  return (
    <FieldPair label="일시">
      <Controller
        control={control}
        name="departureAt"
        rules={{ required: true }}
        render={({ field: { value, onChange, ...field }, fieldState }) => (
          <DateTimePicker
            label="출발"
            value={value ? new Date(value) : null}
            onChange={(next) => onChange(next ? (next as Date).toISOString() : '')}
            slotProps={{ textField: { error: fieldState.invalid, fullWidth: true } }}
            sx={{ flex: 1, ...pickerSx }}
            ampm={false}
            {...field}
          />
        )}
      />
      <RouteArrow />
      <Controller
        control={control}
        name="arrivalAt"
        rules={{ required: true }}
        render={({ field: { value, onChange, ...field }, fieldState }) => (
          <DateTimePicker
            label="도착"
            value={value ? new Date(value) : null}
            onChange={(next) => onChange(next ? (next as Date).toISOString() : '')}
            slotProps={{ textField: { error: fieldState.invalid, fullWidth: true } }}
            sx={{ flex: 1, ...pickerSx }}
            ampm={false}
            {...field}
          />
        )}
      />
    </FieldPair>
  )
}
