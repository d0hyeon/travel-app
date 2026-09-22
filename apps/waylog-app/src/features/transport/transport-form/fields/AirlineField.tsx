import { MaterialIcons } from '@expo/vector-icons'
import { useController, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { Pressable, StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'
import { useAirlineSelectOverlay } from '../../transport-airline/useAirlineSelectOverlay'
import type { TransportFormValues } from '../transportForm.types'

interface Props {
  control: Control<TransportFormValues>
  setValue: UseFormSetValue<TransportFormValues>
}

// 항공사를 고르는 일과 그 결과를 폼에 반영하는 일이 한 책임이다.
export function AirlineField({ control, setValue }: Props) {
  const airlineSelect = useAirlineSelectOverlay()
  const airline = useWatch({ control, name: 'airline' })

  // 실시간 상태 매칭이 기대하는 값은 이름이 아니라 코드다.
  useController({ control, name: 'airlineCode', rules: { required: true } })

  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const select = async () => {
    const selected = await airlineSelect.open()
    if (selected == null) return

    setValue('airline', selected.nameKo, { shouldValidate: true })
    setValue('airlineCode', selected.code, { shouldValidate: true })
  }

  return (
    <View style={styles.field}>
      <Typography style={styles.label}>항공사</Typography>
      <Pressable onPress={select} style={styles.control}>
        <Typography style={airline == null ? styles.placeholder : styles.value}>
          {airline ?? '목록에서 선택'}
        </Typography>
        <MaterialIcons name="search" size={18} color={palette.textSecondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.md,
  },
  placeholder: { fontSize: 15, color: palette.textSecondary },
  value: { fontSize: 15 },
})
