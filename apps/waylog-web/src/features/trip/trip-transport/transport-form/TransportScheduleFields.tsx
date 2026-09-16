import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, type Control } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  control: Control<TransportFormValues>
  departurePlaceholder: string
  arrivalPlaceholder: string
}

// 출발·도착과 일시는 종류와 무관하게 같다. 두 폼이 공유한다.
// 네 값 모두 필수다 -- 하나라도 비면 목록의 "A → B, 09:10 → 10:45" 가
// 성립하지 않는다. 그런 교통편은 이 기능으로 관리할 수 없다.
export function TransportScheduleFields({
  control,
  departurePlaceholder,
  arrivalPlaceholder,
}: Props) {
  const isMobile = useIsMobile()
  const pickerSx = isMobile
    ? { '.MuiPickersSectionList-root': { paddingY: 1.5 }, '.MuiFormLabel-root': { lineHeight: 1 } }
    : {}

  return (
    <>
      <FieldPair label="여정">
        <Controller
          control={control}
          name="departureName"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <TextField
              placeholder={departurePlaceholder}
              error={fieldState.invalid}
              fullWidth
              {...field}
              value={field.value ?? ''}
            />
          )}
        />
        <Arrow />
        <Controller
          control={control}
          name="arrivalName"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <TextField
              placeholder={arrivalPlaceholder}
              error={fieldState.invalid}
              fullWidth
              {...field}
              value={field.value ?? ''}
            />
          )}
        />
      </FieldPair>

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
        <Arrow />
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
    </>
  )
}

// 출발과 도착은 한 쌍으로 읽힌다. 라벨을 따로 달면 둘이 짝이라는 것이 흐려진다.
function FieldPair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={0.75}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}{' '}
        <Typography component="span" variant="caption" color="error">
          *
        </Typography>
      </Typography>
      <Stack direction="row" alignItems="center" gap={1}>
        {children}
      </Stack>
    </Stack>
  )
}

function Arrow() {
  return <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
}
