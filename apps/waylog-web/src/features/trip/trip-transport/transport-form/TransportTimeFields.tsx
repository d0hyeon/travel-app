import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, type Control } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { FieldPair, RouteArrow } from './scheduleFieldParts'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  control: Control<TransportFormValues>
}

export function TransportTimeFields({ control }: Props) {
  const isMobile = useIsMobile()
  const pickerSx = isMobile ? { '.MuiFormLabel-root': { lineHeight: 1 } } : {}

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
