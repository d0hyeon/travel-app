import {
  splitByDeparture,
  useTripScheduledFlights,
  type TripTransport,
} from '@waylog/domains/modules/trip-transport'
import {
  useAirportArrivalGuidances,
  type AirportArrivalGuidance,
} from '@waylog/domains/modules/airport-arrival-guidance'
import { useMemo } from 'react'
import { Dimensions, ScrollView, StyleSheet, View, type ViewProps } from 'react-native'
import { Button, Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../../app/AppRoute'
import { palette, radius } from '../../../shared/config/tokens'
import { TransportCard } from './TransportCard'
import { useTicketViewerOverlay } from './transport-ticket/useTicketViewerOverlay'

const CARD_WIDTH = Dimensions.get('window').width * 0.82
const CARD_GAP = 12

interface Props {
  tripId: string
}

// 다가오는 교통편만 보딩패스 형태로 보여준다. 다음 카드가 옆에 걸쳐 보이게 해
// 더 있다는 것을 도트 없이 알린다.
export function UpcomingTransportSection({ tripId }: Props) {
  const { data: transports } = useTripScheduledFlights(tripId)
  const { upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const airportArrivalGuidances = useAirportArrivalGuidances({
    tripId,
    transportIds: upcoming.map((transport) => transport.id),
  })

  if (upcoming.length === 0) return null

  const isSingleCard = upcoming.length === 1

  return (
    <View style={styles.section}>
      <Typography style={styles.sectionLabel}>다가오는 탑승권</Typography>
      {isSingleCard ? (
        <BoardingPassCard
          tripId={tripId}
          transport={upcoming[0]}
          airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === upcoming[0].id)?.guidance}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.scroll}
          style={styles.bleedRight}
        >
          {upcoming.map((transport) => (
            <BoardingPassCard
              key={transport.id}
            tripId={tripId}
            transport={transport}
            airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === transport.id)?.guidance}
            style={styles.carouselCard}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

interface BoardingPassCardProps extends ViewProps {
  tripId: string
  transport: TripTransport
  airportArrivalGuidance?: AirportArrivalGuidance
}

function BoardingPassCard({ tripId, transport, airportArrivalGuidance, style, ...props }: BoardingPassCardProps) {
  const navigation = useAppNavigation()
  const ticketViewer = useTicketViewerOverlay()

  // 티켓 이미지는 카드에 넣지 않는다. 카드가 티켓 자체로 보이면
  // 실제 티켓을 여는 동작과 구분되지 않는다.
  const [firstTicket] = transport.tickets

  return (
    <View style={[styles.cardWrapper, style]} {...props}>
      <TransportCard
        transport={transport}
        airportArrivalGuidance={airportArrivalGuidance}
        onPress={() => navigation.navigate(AppRoute.여행_교통편_상세, { tripId, transportId: transport.id })}
      />
      {firstTicket != null && (
        <View style={styles.ticketAction}>
          <Button
            variant="outlined"
            fullWidth
            onPress={() => ticketViewer.open({ tripId, ticketId: firstTicket.id })}
          >
            탑승권 열기
          </Button>
        </View>
      )}
    </View>
  )
}

UpcomingTransportSection.Skeleton = function UpcomingTransportSectionSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton variant="text" width={120} height={13} />
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
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 8, width: '100%' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: palette.textSecondary },
  // 캐러셀만 부모 패딩을 넘겨 다음 카드가 화면 끝까지 이어지게 한다.
  bleedRight: { marginRight: -16 },
  scroll: { gap: CARD_GAP, paddingRight: 16 },
  carouselCard: { width: CARD_WIDTH },
  cardWrapper: { gap: 8 },
  ticketAction: { paddingHorizontal: 8 },
  skeletonCard: {
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: palette.background,
  },
  skeletonTypeRow: { marginBottom: 8 },
  skeletonTimes: { marginTop: 16 },
})
