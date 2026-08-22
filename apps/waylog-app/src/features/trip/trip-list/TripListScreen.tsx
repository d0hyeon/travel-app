import { getTripYear, groupTripsByStatus, useTrips } from '@waylog/domains/modules/trip'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, Fab, Stack, Typography } from '../../../shared/components/mui'
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
    <Box sx={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 18, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Typography sx={{ fontSize: 26, fontWeight: '900', paddingVertical: 18 }}>
          내 여행
        </Typography>

        {!hasTrips ? (
          <EmptyTripState onPress={openTripCreation} />
        ) : (
          <Stack sx={{ gap: 24 }}>
            {ongoingTrips.length === 0 && upcomingTrips.length === 0 && (
              <CreateTripCard onPress={openTripCreation} />
            )}

            {ongoingTrips.map((trip) => (
              <OngoingTripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
            ))}

            {(upcomingTrips.length > 0 || pastTrips.length > 0) && (
              <Stack sx={{ gap: 24, paddingHorizontal: 8 }}>
                {upcomingTrips.length > 0 && (
                  <Stack sx={{ gap: 12 }}>
                    <SectionLabel>예정된 여행</SectionLabel>
                    <Stack sx={{ gap: 12 }}>
                      {upcomingTrips.map((trip) => (
                        <UpcomingTripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
                      ))}
                    </Stack>
                  </Stack>
                )}

                {pastYears.length > 0 && (
                  <Stack sx={{ gap: 12 }}>
                    {(ongoingTrips.length > 0 || upcomingTrips.length > 0) && (
                      <SectionLabel>지난 여행</SectionLabel>
                    )}
                    <Stack sx={{ gap: 20 }}>
                      {pastYears.map((year) => (
                        <Stack key={year} sx={{ gap: 8 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: '900', color: palette.textSecondary }}>
                            {year}년
                          </Typography>
                          <Stack sx={{ gap: 8 }}>
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
        onClick={openTripCreation}
        sx={{ position: 'absolute', right: 16, bottom: insets.bottom + 12 }}
      >
        <Typography sx={{ color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '400' }}>+</Typography>
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
    <Typography sx={{ fontSize: 12, fontWeight: '900', color: palette.textSecondary, letterSpacing: 0.5 }}>
      {children}
    </Typography>
  )
}

function EmptyTripState({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="첫 여행 만들기">
      <Box
        sx={{
          alignItems: 'center',
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: 'rgba(76,132,255,0.3)',
          borderRadius: 16,
          paddingVertical: 40,
          paddingHorizontal: 24,
        }}
      >
        <Typography sx={{ color: palette.textSecondary, fontSize: 15, marginBottom: 8 }}>
          아직 여행이 없어요
        </Typography>
        <Typography sx={{ color: palette.primary, fontSize: 14, fontWeight: '900' }}>
          + 첫 여행 만들기
        </Typography>
      </Box>
    </Pressable>
  )
}
