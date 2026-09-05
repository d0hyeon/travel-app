import { Pressable, View } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Chip, Typography } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import type { RecentHotPeriodMonths } from './recentHotPeriod.constants'
import { RECENT_HOT_PERIOD_OPTIONS } from './recentHotPeriod.constants'

interface Props {
  months: RecentHotPeriodMonths
  onChange: (months: RecentHotPeriodMonths) => void
}

export function PeriodFilterChip({ months, onChange }: Props) {
  const overlay = useOverlay()
  const currentLabel = RECENT_HOT_PERIOD_OPTIONS.find((option) => option.value === months)?.label ?? ''

  return (
    <Chip
      label={currentLabel}
      size="small"
      variant="outlined"
      color="primary"
      onClick={() =>
        overlay.open(({ isOpen, close }) => (
          <BottomSheet isOpen={isOpen} onDismiss={close}>
            <BottomSheet.Header>기간 선택</BottomSheet.Header>
            <BottomSheet.Body>
              <View style={{ padding: 16, gap: 8 }}>
                {RECENT_HOT_PERIOD_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value)
                      close()
                    }}
                    style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' }}
                  >
                    <Typography fontWeight={option.value === months ? 'bold' : 'medium'}>{option.label}</Typography>
                    {option.value === months && <Typography color="primary">✓</Typography>}
                  </Pressable>
                ))}
              </View>
            </BottomSheet.Body>
          </BottomSheet>
        ))
      }
    />
  )
}
