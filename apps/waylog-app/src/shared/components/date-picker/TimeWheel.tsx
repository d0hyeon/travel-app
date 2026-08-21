import {
  FlatList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'

import { Typography } from '../mui'
import { buildMinuteOptions } from './calendar.utils'
import type { TimeOfDay } from './datePicker.model'
import { palette, radius } from '../../config/tokens'

const ITEM_HEIGHT = 40
// 위아래로 한 칸씩 보여야 고르는 중이라는 게 읽힌다.
const VISIBLE_COUNT = 3

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

interface TimeWheelProps {
  hours: number
  minutes: number
  minuteStep: number
  onChange: (time: TimeOfDay) => void
}

export function TimeWheel({ hours, minutes, minuteStep, onChange }: TimeWheelProps) {
  const minuteOptions = buildMinuteOptions(minuteStep)

  return (
    <View style={styles.wheels}>
      {/* 가운데 칸을 감싸는 띠. 목록 뒤에 깔려 선택 위치를 알려준다. */}
      <View style={styles.selectionBand} pointerEvents="none" />

      <WheelColumn
        options={HOUR_OPTIONS}
        value={hours}
        suffix="시"
        onChange={(nextHours) => onChange({ hours: nextHours, minutes })}
      />
      <WheelColumn
        options={minuteOptions}
        value={minutes}
        suffix="분"
        onChange={(nextMinutes) => onChange({ hours, minutes: nextMinutes })}
      />
    </View>
  )
}

interface WheelColumnProps {
  options: number[]
  value: number
  suffix: string
  onChange: (value: number) => void
}

function WheelColumn({ options, value, suffix, onChange }: WheelColumnProps) {
  // 눈금에 없는 값이면 맨 위에서 시작한다.
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option === value),
  )

  const handleSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)
    const settled = options[index]
    if (settled != null && settled !== value) onChange(settled)
  }

  return (
    <FlatList
      data={options}
      keyExtractor={(option) => String(option)}
      style={styles.column}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      initialScrollIndex={selectedIndex}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      // 위아래 여백만큼 채워야 첫 항목과 끝 항목도 가운데로 올라온다.
      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * ((VISIBLE_COUNT - 1) / 2) }}
      onMomentumScrollEnd={handleSettle}
      renderItem={({ item }) => {
        const isSelected = item === value

        return (
          <View style={styles.item}>
            <Typography
              variant={isSelected ? 'h6' : 'body1'}
              color={isSelected ? palette.text : palette.textSecondary}
            >
              {String(item).padStart(2, '0')}
              {suffix}
            </Typography>
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  wheels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    height: ITEM_HEIGHT * VISIBLE_COUNT,
  },
  column: { width: 88 },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: 'rgba(76,132,255,0.10)',
  },
})
