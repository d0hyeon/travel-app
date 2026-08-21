import { MaterialIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { Stack, IconButton, Typography } from '../mui'
import { palette } from '../../config/tokens'

interface CalendarHeaderProps {
  cursor: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
}

export function CalendarHeader({ cursor, onPreviousMonth, onNextMonth }: CalendarHeaderProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1 }}>
      <IconButton onClick={onPreviousMonth}>
        <MaterialIcons name="chevron-left" size={24} color={palette.text} />
      </IconButton>

      <Typography variant="h6">{format(cursor, 'yyyy년 M월')}</Typography>

      <IconButton onClick={onNextMonth}>
        <MaterialIcons name="chevron-right" size={24} color={palette.text} />
      </IconButton>
    </Stack>
  )
}
