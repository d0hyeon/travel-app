import { TextField } from '@mui/material'
import { Controller, type Control } from 'react-hook-form'
import { FieldPair, RouteArrow } from './scheduleFieldParts'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  control: Control<TransportFormValues>
}

// 기차·버스는 역·터미널을 목록으로 들고 있지 않아 자유 입력이다.
// 항공과 달리 고를 대상이 없으므로 오버레이도 없다.
export function GroundRouteFields({ control }: Props) {
  return (
    <FieldPair label="여정">
      <Controller
        control={control}
        name="departureName"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <TextField
            placeholder="출발지"
            error={fieldState.invalid}
            fullWidth
            {...field}
            value={field.value ?? ''}
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
            placeholder="도착지"
            error={fieldState.invalid}
            fullWidth
            {...field}
            value={field.value ?? ''}
          />
        )}
      />
    </FieldPair>
  )
}
