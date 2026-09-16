import { MaterialIcons } from '@expo/vector-icons'
import {
  groupByDepartureDate,
  splitByDeparture,
  useTripTransport,
} from '@waylog/domains/modules/trip-transport'
import { format as formatDate } from 'date-fns'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'
import { TransportCard } from './TransportCard'

interface Props {
  tripId: string
  onTransportPress?: (transportId: string) => void
}

export function TripTransportList({ tripId, onTransportPress }: Props) {
  const { data: transports } = useTripTransport(tripId)
  const [isPastOpen, setIsPastOpen] = useState(false)

  // 렌더마다 기준 시각이 달라지면 목록이 흔들린다. 조회 결과가 바뀔 때만 다시 가른다.
  const { past, upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const upcomingGroups = useMemo(() => groupByDepartureDate(upcoming), [upcoming])

  if (transports.length === 0) {
    return (
      <View style={styles.empty}>
        <Typography color="text.secondary">등록된 교통편이 없어요</Typography>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {past.length > 0 && (
        <View style={styles.accordion}>
          <Pressable onPress={() => setIsPastOpen((prev) => !prev)} style={styles.accordionHeader}>
            <Typography style={styles.accordionTitle}>지난 탑승권 ({past.length})</Typography>
            <MaterialIcons
              name={isPastOpen ? 'expand-less' : 'chevron-right'}
              size={18}
              color={palette.textSecondary}
            />
          </Pressable>
          {isPastOpen && (
            <View style={styles.accordionBody}>
              {past.map((transport) => (
                <TransportCard
                  key={transport.id}
                  transport={transport}
                  onPress={() => onTransportPress?.(transport.id)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {upcomingGroups.map((group) => (
        <View key={group.date} style={styles.group}>
          <Typography style={styles.groupLabel}>
            {formatDate(new Date(group.date), 'M/d')}
          </Typography>
          {group.transports.map((transport) => (
            <TransportCard
              key={transport.id}
              transport={transport}
              onPress={() => onTransportPress?.(transport.id)}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 18 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  accordion: {
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accordionTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: palette.textSecondary },
  accordionBody: { padding: 10, gap: 10 },
  group: { gap: 8 },
  groupLabel: { fontSize: 12.5, fontWeight: '700', color: palette.textSecondary },
})
