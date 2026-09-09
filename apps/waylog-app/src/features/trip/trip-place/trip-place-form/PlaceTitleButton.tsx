import { MaterialIcons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import { Stack, Typography, type TypographyVariant } from '~/shared/components/design-system'

interface PlaceTitleButtonProps {
  /** 표시할 장소명 */
  name: string
  /** 타이틀 클릭 시 장소 상세 오버레이를 띄운다 */
  onClick: () => void
  variant?: TypographyVariant
}

/** 장소 수정 오버레이의 타이틀. 우측 화살표를 눌러 장소 상세로 진입한다. */
export function PlaceTitleButton({ name, onClick, variant = 'h6' }: PlaceTitleButtonProps) {
  return (
    <Pressable onPress={onClick}>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Typography variant={variant} noWrap sx={{ fontWeight: '800' }}>
          {name}
        </Typography>
        <MaterialIcons name="chevron-right" size={28} color="#666" />
      </Stack>
    </Pressable>
  )
}
