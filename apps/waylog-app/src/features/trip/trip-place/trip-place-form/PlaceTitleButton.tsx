import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, Pressable } from 'react-native'
import { Skeleton, Stack, Typography, type TypographyVariant } from '~/shared/components/design-system'
import { VARIANT_STYLE } from '~/shared/components/design-system/Typography'

interface PlaceTitleButtonProps {
  /** 표시할 장소명 */
  name: string
  /** 타이틀 클릭 시 장소 상세 오버레이를 띄운다 */
  onPress: () => void
  variant?: TypographyVariant
}

/** 장소 수정 오버레이의 타이틀. 우측 화살표를 눌러 장소 상세로 진입한다. */
export function PlaceTitleButton({ name, onPress, variant = 'h6' }: PlaceTitleButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Typography variant={variant} noWrap style={styles.title}>
          {name}
        </Typography>
        <MaterialIcons name="chevron-right" size={28} color="#666" />
      </Stack>
    </Pressable>
  )
}
PlaceTitleButton.Skeleton = ({ variant = 'h6' }: Pick<PlaceTitleButtonProps, 'variant'>) => {
  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      <Skeleton width={100} height={VARIANT_STYLE[variant].lineHeight} />
      <MaterialIcons name="chevron-right" size={28} color="#666" />
    </Stack>
  )
}

const styles = StyleSheet.create({
  title: { fontWeight: '800' },
})
