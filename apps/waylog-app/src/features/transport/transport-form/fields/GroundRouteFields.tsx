import { Controller, type Control } from 'react-hook-form'
import { TextField } from '~/shared/components/design-system'
import { FieldPair, PairSlot, RouteArrow } from './scheduleFieldParts'
import type { TransportFormValues } from '../transportForm.types'

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
          <PairSlot hasError={fieldState.invalid}>
            <TextField
              placeholder="출발지"
              value={field.value}
              onChangeText={field.onChange}
            />
          </PairSlot>
        )}
      />
      <RouteArrow />
      <Controller
        control={control}
        name="arrivalName"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <PairSlot hasError={fieldState.invalid}>
            <TextField
              placeholder="도착지"
              value={field.value}
              onChangeText={field.onChange}
            />
          </PairSlot>
        )}
      />
    </FieldPair>
  )
}
