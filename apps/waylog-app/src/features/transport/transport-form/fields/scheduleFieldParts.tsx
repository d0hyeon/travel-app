import { MaterialIcons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'

// 출발과 도착은 한 쌍으로 읽힌다. 라벨을 따로 달면 둘이 짝이라는 것이 흐려진다.
export function FieldPair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.pair}>
      <Typography style={styles.label}>
        {label} <Typography style={styles.mark}>*</Typography>
      </Typography>
      <View style={styles.row}>{children}</View>
    </View>
  )
}

export function RouteArrow() {
  return <MaterialIcons name="arrow-forward" size={16} color={palette.textSecondary} />
}

// TextField·DateField 에 에러 표시가 없어 폼에서 테두리를 그린다.
export function PairSlot({ hasError, children }: { hasError?: boolean; children: ReactNode }) {
  return <View style={[styles.slot, hasError && styles.slotError]}>{children}</View>
}

const styles = StyleSheet.create({
  pair: { gap: 6 },
  label: { fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' },
  mark: { color: palette.error },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slot: { flex: 1 },
  slotError: { borderRadius: 8, borderWidth: 1, borderColor: palette.error },
})
