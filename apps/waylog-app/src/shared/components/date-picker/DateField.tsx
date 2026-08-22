import { MaterialIcons } from '@expo/vector-icons'
import { format as formatDate } from 'date-fns'
import { Pressable, StyleSheet, View } from 'react-native'
import { Typography } from '../mui'
import { palette, radius } from '../../config/tokens'
import type { DateRange } from './datePicker.model'
import { useDatePickerBottomSheet } from './useDatePickerBottomSheet'

type DateFieldTypeProps =
  | { type?: 'date'; value?: Date; onChange?: (value: Date) => void }
  | { type: 'dateTime'; value?: Date; minuteStep?: number; onChange?: (value: Date) => void }
  | {
      type: 'range'
      value?: DateRange
      /** 하루만 골라도 확정할 수 있게 한다. 이때 시작일과 종료일이 같아진다. */
      allowSingleDay?: boolean
      onChange?: (value: DateRange) => void
    }

type DateFieldProps = DateFieldTypeProps & {
  placeholder?: string
  /** 표시 형식. 화면마다 다르므로 밖에서 정한다. */
  format?: (value: Date) => string
  disabled?: boolean
}

const DEFAULT_FORMAT = { date: 'yyyy/MM/dd', dateTime: 'yyyy/MM/dd HH:mm' } as const

export function DateField(props: DateFieldProps) {
  const { type = 'date', value, placeholder, format, disabled } = props

  const datePickerBottomSheet = useDatePickerBottomSheet()

  const defaultPattern = type === 'dateTime' ? DEFAULT_FORMAT.dateTime : DEFAULT_FORMAT.date
  const formatValue = format ?? ((date: Date) => formatDate(date, defaultPattern))

  const displayText = toDisplayText(value, formatValue)

  // 타입마다 고르는 모양이 달라 시트를 여는 길도 갈라진다.
  const handlePress = async () => {
    if (props.type === 'range') {
      const range = await datePickerBottomSheet.openRange({
        defaultValue: props.value ?? [null, null],
        allowSingleDay: props.allowSingleDay,
      })
      // 취소하면 null 이 온다. 이때는 기존 값을 그대로 둔다.
      if (range == null) return

      props.onChange?.(range)
      return
    }

    const day = await datePickerBottomSheet.openDay({
      type: props.type,
      defaultValue: props.value ?? null,
      minuteStep: props.type === 'dateTime' ? props.minuteStep : undefined,
    })
    if (day == null) return

    props.onChange?.(day)
  }

  return (
    <Pressable
      style={[styles.field, disabled === true && styles.disabled]}
      onPress={disabled === true ? undefined : handlePress}
    >
      <MaterialIcons name="calendar-today" size={18} color={palette.textSecondary} />
      <View style={styles.valueArea}>
        <Typography
          variant="body1"
          color={displayText == null ? palette.textSecondary : palette.text}
        >
          {displayText ?? placeholder ?? '날짜 선택'}
        </Typography>
      </View>
    </Pressable>
  )
}

function toDisplayText(
  value: Date | DateRange | undefined,
  format: (value: Date) => string,
): string | null {
  if (value == null) return null
  if (Array.isArray(value)) {
    const [start, end] = value
    return `${format(start)} - ${format(end)}`
  }

  return format(value)
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.md,
  },
  disabled: { opacity: 0.4 },
  valueArea: { flex: 1 },
})
