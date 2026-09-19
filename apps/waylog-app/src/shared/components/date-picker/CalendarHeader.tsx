import { StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { Stack, IconButton, Typography } from '~/shared/components/design-system'
import { palette } from '../../config/tokens'

// 두 단계의 헤더는 같은 높이여야 단계를 옮길 때 시트가 밀리지 않는다.
// medium IconButton(36) 이 줄 높이를 정하고 위아래 여백이 더해진다.
const HEADER_VERTICAL_PADDING = 8
const HEADER_ROW_HEIGHT = 36
export const CALENDAR_HEADER_HEIGHT = HEADER_ROW_HEIGHT + HEADER_VERTICAL_PADDING * 2

interface CalendarHeaderProps {
  cursor: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
}

export function CalendarHeader({ cursor, onPreviousMonth, onNextMonth }: CalendarHeaderProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" style={styles.stack}>
      <IconButton onPress={onPreviousMonth}>
        <MaterialIcons name="chevron-left" size={24} color={palette.text} />
      </IconButton>

      <Typography variant="h6">{format(cursor, 'yyyy년 M월')}</Typography>

      <IconButton onPress={onNextMonth}>
        <MaterialIcons name="chevron-right" size={24} color={palette.text} />
      </IconButton>
    </Stack>
  )
}

const styles = StyleSheet.create({
  stack: {
    paddingHorizontal: 8,
    paddingVertical: HEADER_VERTICAL_PADDING,
    height: CALENDAR_HEADER_HEIGHT,
  },
})
