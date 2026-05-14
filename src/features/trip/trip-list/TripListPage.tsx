import AddIcon from '@mui/icons-material/Add'
import { alpha, Box, ButtonBase, Container, Fab, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useScrollRestore } from '~shared/hooks/interaction/useScrollRestore'
import { useOverlay } from '~shared/hooks/useOverlay'
import { TripFormDialog } from '../components/TripFormDialog'
import type { Trip } from '../trip.types'
import { OngoingHero } from './OngoingHero'
import { PastTripRow } from './PastTripRow'
import { UpcomingCard } from './UpcomingCard'
import { getDaysUntil, getTripStatus, getTripYear } from './trip-list.utils'
import { useTrips } from '../useTrips'
import { CreateTripCardButton } from './CreateTripCardButton'

export default function TripListPage() {
  const { data: trips, create } = useTrips()
  const overlay = useOverlay()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  useScrollRestore()

  const openCreationPopup = () => {
    overlay.open(({ isOpen, close }) => (
      <TripFormDialog
        open={isOpen}
        onClose={close}
        onSubmit={async (data) => {
          const trip = await create({
            ...data,
            exchangeRate: null,
            exchangeRates: null,
          })
          navigate(`/trip/${trip.id}`)
        }}
      />
    ))
  }

  const ongoingTrips = trips.filter((t) => getTripStatus(t.startDate, t.endDate) === 'ongoing')
  const upcomingTrips = trips
    .filter((t) => getTripStatus(t.startDate, t.endDate) === 'upcoming')
    .toSorted((a, b) => getDaysUntil(a.startDate) - getDaysUntil(b.startDate))
  const pastTrips = trips
    .filter((t) => getTripStatus(t.startDate, t.endDate) === 'past')
    .toSorted((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const pastByYear = pastTrips.reduce<Record<string, Trip[]>>((acc, trip) => {
    const year = getTripYear(trip.startDate)
      ; (acc[year] ??= []).push(trip)
    return acc
  }, {})
  const pastYears = Object.keys(pastByYear).toSorted((a, b) => Number(b) - Number(a))
  const hasAnyTrip = trips.length > 0;

  return (
    <>
      <Container maxWidth="sm" sx={{ pb: 12, overflow: 'hidden' }}>
        <Typography
          sx={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: -0.5,
            p: '18px 18px 14px',
            mx: '-18px',
          }}
        >
          내 여행
        </Typography>

        {!hasAnyTrip ? (
          <EmptyStateCTA onAdd={isMobile ? () => navigate(AppRoute.여행_생성) : openCreationPopup} />
        ) : (
          <Stack spacing={0}>
            {(ongoingTrips.length === 0 && upcomingTrips.length === 0) && (
              <CreateTripCardButton marginBottom={4} />
            )}
            {ongoingTrips.map((trip) => (
              <Box key={trip.id} mb={3}>
                <OngoingHero trip={trip} />
              </Box>
            ))}
            <Box paddingX={1}>
              {(upcomingTrips.length > 0 || pastTrips.length > 0) && (
                <TimelineSection>
                  {upcomingTrips.length > 0 && (
                    <Box mb={3}>
                      <SectionLabel>예정된 여행</SectionLabel>
                      <Stack spacing={1.5}>
                        {upcomingTrips.map((trip) => (
                          <UpcomingCard key={trip.id} trip={trip} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {pastYears.length > 0 && (
                    <Box>
                      {(ongoingTrips.length > 0 || upcomingTrips.length > 0) && (
                        <SectionLabel>지난 여행</SectionLabel>
                      )}
                      <Stack spacing={2}>
                        {pastYears.map((year) => (
                          <Box key={year}>
                            <YearLabel year={year} />
                            <Stack gap={1} marginTop={1}>
                              {pastByYear[year].map((trip) => (
                                <PastTripRow key={trip.id} trip={trip} />
                              ))}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </TimelineSection>
              )}
            </Box>
          </Stack>
        )}
      </Container>

      {isMobile && (
        <Fab
          color="primary"
          onClick={() => navigate(AppRoute.여행_생성)}
          aria-label="새 여행"
          sx={{
            position: 'fixed',
            right: 16,
            bottom: `calc(${BottomNavigation.HEIGHT + 24}px + env(safe-area-inset-bottom))`,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </>
  )
}

function TimelineSection({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ borderLeft: '2px solid rgba(0,0,0,0.08)', pl: '28px', overflow: 'hidden' }}>
      {children}
    </Box>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 700,
        color: 'text.disabled',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  )
}

function YearLabel({ year }: { year: string }) {
  return (
    <Box position="relative" display="inline-block">
      <Typography
        color="textSecondary"
        variant="body2"
        sx={{
          position: 'relative',
          fontWeight: 700,
          mb: 0.5,
          marginLeft: -3.5,
          paddingLeft: 3.5,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            height: '2px',
            bgcolor: 'rgba(0,0,0,0.1)',
            width: 'calc(100% - 16px)',
            left: 0,
            transform: 'translate(-50%, 0)',
            zIndex: -1,
          },
        }}
      >
        {year}
      </Typography>
    </Box>
  )
}

function EmptyStateCTA({ onAdd }: { onAdd: () => void }) {
  return (
    <ButtonBase
      onClick={onAdd}
      sx={{
        width: '100%',
        display: 'block',
        textAlign: 'center',
        border: '2px dashed rgba(76,132,255,0.3)',
        borderRadius: '16px',
        py: 5,
        px: 3,
        '&:hover': { bgcolor: 'rgba(76,132,255,0.04)' },
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontSize: 15, mb: 1 }}>
        아직 여행이 없어요
      </Typography>
      <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: 14 }}>
        + 첫 여행 만들기
      </Typography>
    </ButtonBase>
  )
}
