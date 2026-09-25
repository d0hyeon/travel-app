import {
  groupByDepartureDate,
  splitByDeparture,
  useTripScheduledFlights,
} from '@waylog/domains/modules/trip-transport'
import { useAirportArrivalGuidances } from '@waylog/domains/modules/airport-arrival-guidance'
import { getSupportedFlightStatusAirportCodes } from '@waylog/domains/modules/flight-status'
import { useAirports } from '@waylog/domains/modules/airport'
import { MaterialIcons } from '@expo/vector-icons'
import { format as formatDate } from 'date-fns'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Accordion, Box, Button, Stack, Typography } from '~/shared/components/design-system'
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../../app/AppRoute'
import { palette } from '../../../shared/config/tokens'
import { TransportCard } from './TransportCard'

interface Props {
  tripId: string
  onTransportPress?: (transportId: string) => void
}

export function TripTransportList({ tripId, onTransportPress }: Props) {
  const { data: transports } = useTripScheduledFlights(tripId)
  const airportArrivalGuidances = useAirportArrivalGuidances({
    tripId,
    transportIds: transports.map((transport) => transport.id),
  })
  const navigation = useAppNavigation()

  // 렌더마다 기준 시각이 달라지면 목록이 흔들린다. 조회 결과가 바뀔 때만 다시 가른다.
  const { past, upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const upcomingGroups = useMemo(() => groupByDepartureDate(upcoming), [upcoming])
  const { data: airports } = useAirports()
  const supportedAirportNames = getSupportedFlightStatusAirportCodes()
    .map((airportCode) => airports.find((airport) => airport.code === airportCode)?.nameKo)
    .filter((airportName): airportName is string => airportName != null)

  if (transports.length === 0) {
    return (
      <View style={styles.empty}>
        <Box style={styles.emptyIcon}>
          <MaterialIcons name="flight-takeoff" size={26} color={palette.primary} />
        </Box>
        <Typography variant="subtitle1" style={styles.emptyTitle}>
          탑승권을 등록해보세요
        </Typography>
        <Typography color="text.secondary" textAlign="center" style={styles.emptyDescription}>
          탑승 전, 여정 변동(지연, 결항, 탑승구 변경)등{`\n`}중요한 상황을 놓치지 않도록 알려드려요
        </Typography>
        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={<MaterialIcons name="add" size={18} color={palette.onPrimary} />}
          onPress={() => navigation.navigate(AppRoute.여행_교통편_추가, { tripId })}
        >
          탑승권 등록
        </Button>
        <Stack direction="row" alignItems="center" style={styles.supportedAirport}>

          <Typography color="text.secondary" style={styles.supportedAirportLabel}>
            * 여정 변동 알림은 {supportedAirportNames} 출발 항공편에 한해 지원돼요.
          </Typography>
        </Stack>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {past.length > 0 && (
        <Accordion>
          <Accordion.Summary>지난 탑승권 ({past.length})</Accordion.Summary>
          <Accordion.Details>
            {past.map((transport) => (
              <TransportCard
                key={transport.id}
                transport={transport}
                airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === transport.id)?.guidance}
                onPress={() => onTransportPress?.(transport.id)}
              />
            ))}
          </Accordion.Details>
        </Accordion>
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
              airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === transport.id)?.guidance}
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
  empty: { alignItems: 'center', padding: 24, gap: 12, borderRadius: 16, borderWidth: 1, borderColor: palette.divider, backgroundColor: palette.primaryContainer },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  emptyTitle: { fontWeight: '900' },
  emptyDescription: { lineHeight: 21 },
  supportedAirport: { gap: 6, borderRadius: 20, alignSelf: 'flex-end', marginTop: 8, marginBottom: -12 },
  supportedAirportLabel: { fontSize: 12 },
  group: { gap: 8 },
  groupLabel: { fontSize: 12.5, fontWeight: '700', color: palette.textSecondary },
})
