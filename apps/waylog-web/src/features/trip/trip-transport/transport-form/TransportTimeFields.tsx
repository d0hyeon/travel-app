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
  const pickerSx = isMobile
    ? {
      '& .MuiInputBase-root': { height: 48 },
      '& .MuiInputBase-input': { py: 0, display: 'flex', alignItems: 'center' },
      '& .MuiInputBase-input::placeholder': { color: 'text.secondary', opacity: 1 },
    }
    : {}

  return (
    <FieldPair label="일시">
      <Controller
        control={control}
        name="departureAt"
        rules={{ required: true }}
        render={({ field: { value, onChange, ...field }, fieldState }) => (
          <DateTimePicker
            value={value ? new Date(value) : null}
            onChange={(next) => onChange(next ? (next as Date).toISOString() : '')}
            slotProps={{ textField: { error: fieldState.invalid, fullWidth: true, placeholder: '출발' } }}
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
            value={value ? new Date(value) : null}
            onChange={(next) => onChange(next ? (next as Date).toISOString() : '')}
            slotProps={{ textField: { error: fieldState.invalid, fullWidth: true, placeholder: '도착' } }}
            sx={{ flex: 1, ...pickerSx }}
            ampm={false}
            {...field}
          />
        )}
      />
    </FieldPair>
  )
}
