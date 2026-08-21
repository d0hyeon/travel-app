import { MaterialIcons } from '@expo/vector-icons'
import { format as formatDate } from 'date-fns'
import { Pressable, StyleSheet, View } from 'react-native'
import { Typography } from '../mui'
import { palette, radius } from '../../config/tokens'
import { DEFAULT_MINUTE_STEP } from './datePicker.model'
import type { DateRange, DateRangeSelection } from './datePicker.model'
import { useDatePickerBottomSheet } from './useDatePickerBottomSheet'

type DateFieldModeProps =
  | { mode?: 'single'; value?: Date; onChange?: (value: Date) => void }
  | { mode: 'range'; value?: DateRange; onChange?: (value: DateRange) => void }
  | { mode: 'time'; value?: Date; onChange?: (value: Date) => void; minuteStep?: number }

type DateFieldProps = DateFieldModeProps & {
  placeholder?: string
  /** 표시 형식. 화면마다 다르므로 밖에서 정한다. */
  format?: (value: Date) => string
  disabled?: boolean
}

const DEFAULT_FORMAT = { date: 'yyyy/MM/dd', time: 'yyyy/MM/dd HH:mm' } as const

export function DateField(props: DateFieldProps) {
  const { mode = 'single', value, placeholder, format, disabled } = props
  const minuteStep = props.mode === 'time' ? (props.minuteStep ?? DEFAULT_MINUTE_STEP) : DEFAULT_MINUTE_STEP

  const datePickerBottomSheet = useDatePickerBottomSheet()

  const defaultPattern = mode === 'time' ? DEFAULT_FORMAT.time : DEFAULT_FORMAT.date
  const formatValue = format ?? ((date: Date) => formatDate(date, defaultPattern))

  const displayText = toDisplayText(value, formatValue)

  const handlePress = async () => {
    const selection = await datePickerBottomSheet.open({
      mode,
      defaultSelection: toSelection(value),
      minuteStep,
    })
    // 취소하면 null 이 온다. 이때는 기존 값을 그대로 둔다.
    if (selection == null) return

    const [start, end] = selection
    if (start == null) return

    // mode 마다 onChange 가 받는 모양이 달라 props 를 좁혀서 넘긴다.
    if (props.mode === 'range') {
      if (end == null) return
      props.onChange?.([start, end])
      return
    }

    props.onChange?.(start)
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

function toSelection(value: Date | DateRange | undefined): DateRangeSelection {
  if (value == null) return [null, null]
  if (Array.isArray(value)) return value

  return [value, null]
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
