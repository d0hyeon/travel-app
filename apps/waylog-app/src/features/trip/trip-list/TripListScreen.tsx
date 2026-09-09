import { getTripYear, groupTripsByStatus, useTrips } from '@waylog/domains/modules/trip'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, Fab, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { CreateTripCard } from './CreateTripCard'
import { OngoingTripCard } from './OngoingTripCard'
import { PastTripRow } from './PastTripRow'
import { UpcomingTripCard } from './UpcomingTripCard'

type Trip = Parameters<typeof groupTripsByStatus>[0][number]

export function TripListScreen() {
  const { data: trips } = useTrips()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { ongoing: ongoingTrips, upcoming: upcomingTrips, past: pastTrips } = groupTripsByStatus(trips)
  const pastTripsByYear = groupTripsByYear(pastTrips)
  const pastYears = Object.keys(pastTripsByYear).toSorted((firstYear, secondYear) => Number(secondYear) - Number(firstYear))
  const hasTrips = trips.length > 0
  const openTrip = (tripId: string) => router.push(`/trip/${tripId}`)
  const openTripCreation = () => router.push('/trip/new')

  return (
    <Box style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography style={styles.pageTitle}>
          내 여행
        </Typography>

        {!hasTrips ? (
          <EmptyTripState onPress={openTripCreation} />
        ) : (
          <Stack style={styles.tripSections}>
            {ongoingTrips.length === 0 && upcomingTrips.length === 0 && (
              <CreateTripCard onPress={openTripCreation} />
            )}

            {ongoingTrips.map((trip) => (
              <OngoingTripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
            ))}

            {(upcomingTrips.length > 0 || pastTrips.length > 0) && (
              <Stack style={styles.groupedSections}>
                {upcomingTrips.length > 0 && (
                  <Stack style={styles.sectionGap}>
                    <SectionLabel>예정된 여행</SectionLabel>
                    <Stack style={styles.sectionGap}>
                      {upcomingTrips.map((trip) => (
                        <UpcomingTripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
                      ))}
                    </Stack>
                  </Stack>
                )}

                {pastYears.length > 0 && (
                  <Stack style={styles.sectionGap}>
                    {(ongoingTrips.length > 0 || upcomingTrips.length > 0) && (
                      <SectionLabel>지난 여행</SectionLabel>
                    )}
                    <Stack style={styles.yearGroupList}>
                      {pastYears.map((year) => (
                        <Stack key={year} style={styles.yearGroup}>
                          <Typography style={styles.yearLabel}>
                            {year}년
                          </Typography>
                          <Stack style={styles.yearGroup}>
                            {pastTripsByYear[year]?.map((trip) => (
                              <PastTripRow key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
                            ))}
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </ScrollView>

      <Fab
        onPress={openTripCreation}
        style={styles.fab}
      >
        <Typography style={styles.fabLabel}>+</Typography>
      </Fab>
    </Box>
  )
}

function groupTripsByYear(trips: Trip[]) {
  return trips.reduce<Record<string, Trip[]>>((tripsByYear, trip) => {
    const year = getTripYear(trip.startDate)
    const tripsForYear = tripsByYear[year] ?? []
    tripsByYear[year] = [...tripsForYear, trip]
    return tripsByYear
  }, {})
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography style={styles.sectionLabel}>
      {children}
    </Typography>
  )
}

function EmptyTripState({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="첫 여행 만들기">
      <Box
        style={styles.emptyState}
      >
        <Typography style={styles.emptyStateDescription}>
          아직 여행이 없어요
        </Typography>
        <Typography style={styles.emptyStateAction}>
          + 첫 여행 만들기
        </Typography>
      </Box>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    paddingVertical: 18,
  },
  tripSections: {
    gap: 24,
  },
  groupedSections: {
    gap: 24,
    paddingHorizontal: 8,
  },
  sectionGap: {
    gap: 12,
  },
  yearGroupList: {
    gap: 20,
  },
  yearGroup: {
    gap: 8,
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.textSecondary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.textSecondary,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(76,132,255,0.3)',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateDescription: {
    color: palette.textSecondary,
    fontSize: 15,
    marginBottom: 8,
  },
  emptyStateAction: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
  },
})
