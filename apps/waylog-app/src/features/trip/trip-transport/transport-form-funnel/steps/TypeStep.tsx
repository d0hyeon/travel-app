import { Pressable, StyleSheet, View } from 'react-native'
import { Button, Typography } from '~/shared/components/design-system'
import { TransportType, TransportTypeLabel } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useState } from 'react'
import { palette, radius } from '../../../../../shared/config/tokens'
import { TransportTypeIcon } from '../../../../transport/TransportTypeIcon'

const SELECTABLE_TYPES: TripTransportType[] = [
  TransportType.항공,
  TransportType.기차,
  TransportType.버스,
]

interface Props {
  defaultValue?: TripTransportType
  onNext: (type: TripTransportType) => void
}

export function TypeStep({ defaultValue, onNext }: Props) {
  const [selected, setSelected] = useState<TripTransportType | undefined>(defaultValue)

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Typography style={styles.heading}>어떤 교통편인가요?</Typography>

        <View style={styles.tiles}>
          {SELECTABLE_TYPES.map((type) => {
            const isSelected = selected === type

            return (
              <Pressable
                key={type}
                onPress={() => setSelected(type)}
                style={[styles.tile, isSelected && styles.tileSelected]}
              >
                <Typography style={styles.tileLabel}>{TransportTypeLabel[type]}</Typography>
                <TransportTypeIcon
                  type={type}
                  size={20}
                  color={isSelected ? palette.primary : palette.textSecondary}
                />
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={selected == null}
          onPress={() => selected && onNext(selected)}
        >
          다음
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tiles: { gap: 12 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  tileSelected: { borderColor: palette.primary, backgroundColor: palette.primaryContainer },
  tileLabel: { fontSize: 15, fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: palette.divider, flexDirection: 'row' },
})
