import { format as formatDate } from 'date-fns'
import { Controller, useWatch, type Control } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { DateField } from '../../../../shared/components/date-picker'
import { RouteArrow } from './scheduleFieldParts'
import type { TransportFormValues } from '../transportForm.types'

interface Props {
  control: Control<TransportFormValues>
}

export function TransportTimeFields({ control }: Props) {
  // 두 필드는 서로의 경계다. 도착이 출발보다 앞서는 조합을 달력에서 고를 수 없게 한다.
  const departureAt = useWatch({ control, name: 'departureAt' })
  const arrivalAt = useWatch({ control, name: 'arrivalAt' })

  return (
    <View style={styles.row}>
      <Controller
        control={control}
        name="departureAt"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <TimeSlot label="출발 일시" required hasError={fieldState.invalid}>
            <DateField
              type="dateTime"
              maxDate={arrivalAt ? new Date(arrivalAt) : undefined}
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date) => field.onChange(date.toISOString())}
              format={(date) => formatDate(date, 'M/d HH:mm')}
            />
          </TimeSlot>
        )}
      />
      <View style={styles.arrowSlot}>
        <Typography style={styles.label}> </Typography>
        <View style={styles.arrowField}>
          <RouteArrow />
        </View>
      </View>
      <Controller
        control={control}
        name="arrivalAt"
        render={({ field, fieldState }) => (
          <TimeSlot label="도착 일시" hasError={fieldState.invalid}>
            <DateField
              type="dateTime"
              minDate={departureAt ? new Date(departureAt) : undefined}
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date) => field.onChange(date.toISOString())}
              format={(date) => formatDate(date, 'M/d HH:mm')}
            />
          </TimeSlot>
        )}
      />
    </View>
  )
}

function TimeSlot({
  label,
  required,
  hasError,
  children,
}: {
  label: string
  required?: boolean
  hasError?: boolean
  children: React.ReactNode
}) {
  return (
    <View style={styles.slot}>
      <Typography style={styles.label} noWrap>
        {label} {required && <Typography style={styles.mark}>*</Typography>}
      </Typography>
      <View style={[styles.field, hasError && styles.fieldError]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  slot: { flex: 1, gap: 6 },
  arrowSlot: { gap: 6 },
  arrowField: { height: 40, justifyContent: 'center' },
  label: { fontSize: 12.5, lineHeight: 16, color: palette.textSecondary, fontWeight: '600' },
  mark: { color: palette.error },
  field: {},
  fieldError: { borderRadius: 8, borderWidth: 1, borderColor: palette.error },
})
