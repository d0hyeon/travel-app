import {
  groupByDepartureDate,
  splitByDeparture,
  useTripScheduledFlights,
} from '@waylog/domains/modules/trip-transport'
import {
  DOMESTIC_CONGESTION_AIRPORT_CODES,
  useAirportArrivalGuidances,
} from '@waylog/domains/modules/airport-arrival-guidance'
import { getSupportedFlightStatusAirportCodes } from '@waylog/domains/modules/flight-status'
import { useAirports } from '@waylog/domains/modules/airport'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { format as formatDate } from 'date-fns'
import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Accordion, Box, Button, Divider, Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { AppRoute } from '../../../app/AppRoute'
import { SupportedNotificationSheet } from './SupportedNotificationSheet'
import { TransportCard } from './TransportCard'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { palette, radius } from '~/shared/config/tokens';
import { useTheme } from 'tamagui'

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

  // 렌더마다 기준 시각이 달라지면 목록이 흔들린다. 조회 결과가 바뀔 때만 다시 가른다.
  const { past, upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const upcomingGroups = useMemo(() => groupByDepartureDate(upcoming), [upcoming])

  if (transports.length === 0) {
    return <TransportEmptyCard tripId={tripId} />
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

TripTransportList.Skeleton = function TripTransportListSkeleton() {
  return (
    <View style={styles.list}>
      <View style={styles.group}>
        <Skeleton variant="text" width={40} height={12.5} />
        <TransportCardSkeleton />
      </View>
      <View style={styles.group}>
        <TransportCardSkeleton />
      </View>
    </View>
  )
}

interface TransportEmptyCardProps {
  tripId: string;
}

function TransportEmptyCard({ tripId }: TransportEmptyCardProps) {
  const navigation = useAppNavigation()

  return (
    <View style={styles.empty}>
      <Box style={styles.emptyIcon}>
        <MaterialIcons name="flight-takeoff" size={26} color={palette.primary} />
      </Box>
      <Stack alignItems="center" gap={0.5} mb={1}>
        <Typography variant="h6">탑승권을 등록해보세요</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" >
          중요한 상황을 놓치지 않도록 알려드려요
        </Typography>
        <Stack style={styles.details} gap={1}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box style={[styles.symbol, { backgroundColor: palette.errorContainer }]}>
              <MaterialCommunityIcons name="exclamation-thick" size={14} color={palette.error} />
            </Box>
            <Stack gap={0.25}>
              <Typography variant="subtitle2">여정 변동 안내</Typography>
              <Typography variant="caption" color="text.disabled">지연, 결항, 탑승구 변경</Typography>
            </Stack>
          </Stack>
          <Divider style={{ backgroundColor: '#eee' }} />
          <Stack direction="row" alignItems="center" gap={1} style={styles.detailRow}>
            <Box style={[styles.symbol, { backgroundColor: palette.primaryContainer }]}>
              <Ionicons name="time-outline" size={14} color={palette.primary} />
            </Box>
            <Stack gap={0.25}>
              <Typography variant="subtitle2">공항 도착 권장시간 안내</Typography>
            </Stack>
          </Stack>
          <Divider style={{ backgroundColor: '#eee' }} />
          <Stack direction="row" alignItems="center" gap={1} style={styles.detailRow}>
            <Box style={[styles.symbol, { backgroundColor: '#E5F8EF' }]}>
              <MaterialIcons name="check" size={14} color={palette.success} />
            </Box>
            <Stack gap={0.25}>
              <Typography variant="subtitle2">탑승 안내</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Button
        fullWidth
        size="large"
        variant="contained"
        startIcon={<MaterialIcons name="add" size={18} color={palette.onPrimary} />}
        onPress={() => navigation.navigate(AppRoute.여행_교통편_추가, { tripId })}
      >
        탑승권 등록
      </Button>
      <SupportedNotificationButton />
    </View>
  )
}

function SupportedNotificationButton() {
  const overlay = useOverlay()
  const { data: airports } = useAirports()

  const toAirportNames = (airportCodes: readonly string[]) =>
    airportCodes
      .map((airportCode) => airports.find((airport) => airport.code === airportCode)?.nameKo)
      .filter((airportName): airportName is string => airportName != null)
      .map((airportName) => airportName.replace(/(국제)?공항$/, ''))

  const openSupportedNotification = () => {
    overlay.open(({ isOpen, close }) => (
      <SupportedNotificationSheet
        isOpen={isOpen}
        onDismiss={close}
        flightStatusAirportNames={toAirportNames(getSupportedFlightStatusAirportCodes())}
        guidanceAirportNames={toAirportNames(DOMESTIC_CONGESTION_AIRPORT_CODES)}
      />
    ))
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      as={Pressable}
      onPress={openSupportedNotification}
      style={{ alignSelf: 'flex-end', marginBottom: -8 }}
    >
      <Typography variant="caption" color="text.disabled">
        자세히 보기
      </Typography>
      <MaterialIcons name="arrow-right" color={palette.textDisabled} size={24} />
    </Stack >
  )
}

function TransportCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton variant="text" width={60} height={12} style={styles.skeletonTypeRow} />
      <Skeleton variant="text" width={90} height={12} />
      <Stack direction="row" justifyContent="space-between" style={styles.skeletonTimes}>
        <Stack gap={1}>
          <Skeleton variant="text" width={70} height={22} />
          <Skeleton variant="text" width={80} height={12} />
        </Stack>
        <Stack gap={1} alignItems="flex-end">
          <Skeleton variant="text" width={70} height={22} />
          <Skeleton variant="text" width={80} height={12} />
        </Stack>
      </Stack>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 18 },
  empty: { alignItems: 'center', padding: 24, gap: 12, borderRadius: 16, borderWidth: 1, borderColor: palette.divider, backgroundColor: palette.primaryContainer },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  supportedAirport: { gap: 6, borderRadius: 20, alignSelf: 'flex-end', marginTop: 8, marginBottom: -12 },
  supportedAirportLabel: { fontSize: 12 },
  group: { gap: 8 },
  groupLabel: { fontSize: 12.5, fontWeight: '700', color: palette.textSecondary },
  skeletonCard: {
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.background,
  },
  skeletonTypeRow: { marginBottom: 8 },
  skeletonTimes: { marginTop: 16 },
  details: { minWidth: '100%', marginTop: 12, backgroundColor: palette.background, padding: 12, borderRadius: 16, },
  detailRow: { minHeight: 36 },
  symbol: { alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8 }
})
