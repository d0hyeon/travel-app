import { format as formatDate } from 'date-fns'
import { Controller, type Control } from 'react-hook-form'
import { DateField } from '../../../../shared/components/date-picker'
import { FieldPair, PairSlot, RouteArrow } from './scheduleFieldParts'
import type { TransportFormValues } from './transportFormFunnel.types'

interface Props {
  control: Control<TransportFormValues>
}

// 출발·도착 일시는 종류와 무관하게 같다. 두 값 모두 필수다 --
// 하나라도 비면 목록의 "A → B, 09:10 → 10:45" 가 성립하지 않는다.
export function TransportTimeFields({ control }: Props) {
  return (
    <FieldPair label="일시">
      <Controller
        control={control}
        name="departureAt"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <PairSlot hasError={fieldState.invalid}>
            <DateField
              type="dateTime"
              placeholder="출발"
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date) => field.onChange(date.toISOString())}
              format={(date) => formatDate(date, 'M/d HH:mm')}
            />
          </PairSlot>
        )}
      />
      <RouteArrow />
      <Controller
        control={control}
        name="arrivalAt"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <PairSlot hasError={fieldState.invalid}>
            <DateField
              type="dateTime"
              placeholder="도착"
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date) => field.onChange(date.toISOString())}
              format={(date) => formatDate(date, 'M/d HH:mm')}
            />
          </PairSlot>
        )}
      />
    </FieldPair>
  )
}
