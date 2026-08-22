import { MaterialIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { Stack, IconButton, Typography } from '../mui'
import { palette } from '../../config/tokens'
import { Pressable } from 'react-native'

interface TimeStepHeaderProps {
  /** 시각을 얹는 날. 어느 날을 고치는 중인지 보여준다. */
  day: Date
  onBack: () => void
}

/** 시각 단계에서 날짜로 돌아가는 길. 달 이동은 여기 없다. */
export function TimeStepHeader({ day, onBack }: TimeStepHeaderProps) {
  return (
    <Pressable onPress={onBack}>
      <Stack direction="row" alignItems="center" sx={{ px: 1, py: 1, gap: 1 }}>
        <MaterialIcons name="chevron-left" size={24} color={palette.text} />
        <Typography variant="h6">{format(day, 'M월 d일')}</Typography>
      </Stack>
    </Pressable>
  )
}
