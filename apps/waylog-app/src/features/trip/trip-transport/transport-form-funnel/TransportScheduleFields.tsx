import { MaterialIcons } from '@expo/vector-icons'
import { format as formatDate } from 'date-fns'
import { Controller, type Control } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'
import { TextField, Typography } from '~/shared/components/design-system'
import { DateField } from '../../../../shared/components/date-picker'
import { palette } from '../../../../shared/config/tokens'
import type { TransportFormValues } from './transportFormFunnel.types'

interface Props {
  control: Control<TransportFormValues>
  departurePlaceholder: string
  arrivalPlaceholder: string
}

// 출발·도착과 일시는 종류와 무관하게 같다. 두 폼이 공유한다.
// 네 값 모두 필수다 -- 하나라도 비면 목록의 "A → B, 09:10 → 10:45" 가
// 성립하지 않는다. 그런 교통편은 이 기능으로 관리할 수 없다.
export function TransportScheduleFields({ control, departurePlaceholder, arrivalPlaceholder }: Props) {

  return (
    <>
      <FieldPair label="여정">
        <Controller
          control={control}
          name="departureName"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <PairSlot hasError={fieldState.invalid}>
              <TextField
                placeholder={departurePlaceholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            </PairSlot>
          )}
        />
        <Arrow />
        <Controller
          control={control}
          name="arrivalName"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <PairSlot hasError={fieldState.invalid}>
              <TextField
                placeholder={arrivalPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            </PairSlot>
          )}
        />
      </FieldPair>

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
        <Arrow />
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
    </>
  )
}

// 출발과 도착은 한 쌍으로 읽힌다. 라벨을 따로 달면 둘이 짝이라는 것이 흐려진다.
function FieldPair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.pair}>
      <Typography style={styles.label}>
        {label} <Typography style={styles.mark}>*</Typography>
      </Typography>
      <View style={styles.row}>{children}</View>
    </View>
  )
}

function Arrow() {
  return <MaterialIcons name="arrow-forward" size={16} color={palette.textSecondary} />
}

// TextField·DateField 에 에러 표시가 없어 폼에서 테두리를 그린다.
function PairSlot({ hasError, children }: { hasError: boolean; children: React.ReactNode }) {
  return <View style={[styles.slot, hasError && styles.slotError]}>{children}</View>
}

const styles = StyleSheet.create({
  pair: { gap: 6 },
  label: { fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' },
  mark: { color: palette.error },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slot: { flex: 1 },
  slotError: { borderRadius: 8, borderWidth: 1, borderColor: palette.error },
})
