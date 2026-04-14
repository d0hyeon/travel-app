import {
  Box,
  Button,
  Container,
  Stack,
  Typography
} from '@mui/material'
import { Link, PrefetchPageLinks, useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { BottomArea } from '~shared/components/BottomArea'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { ListItem } from '../../shared/components/ListItem'
import { TripFormDialog } from './components/TripFormDialog'
import { useTrips } from './useTrips'

export default function TripListPage() {
  const { data: trips, create } = useTrips();
  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const openCreationPopup = () => {
    overlay.open(({ isOpen, close }) => (
      <TripFormDialog
        open={isOpen}
        onClose={close}
        onSubmit={async (data) => {
          const trip = await create({
            ...data,
            exchangeRate: null,
            exchangeRates: null
          })
          navigate(`/trip/${trip.id}`)
        }}
      />
    ))
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4, pb: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" >
            내 여행
          </Typography>
          {!isMobile && (
            <Button
              variant="contained"
              onClick={() => openCreationPopup()}
            >
              새 여행
            </Button>
          )}
        </Stack>

        {trips.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="body1" color="text.secondary">
              아직 여행이 없어요. 새 여행을 만들어보세요!
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {trips.map((trip, idx) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <PrefetchPageLinks page={`/trip/${trip.id}`} />
                <ListItem
                  leftAddon={<ListItem.Ordering>{idx + 1}</ListItem.Ordering>}
                >
                  <ListItem.Title>{trip.name}</ListItem.Title>
                  <ListItem.Text>{trip.startDate} ~ {trip.endDate}</ListItem.Text>
                </ListItem>
              </Link>
            ))}
          </Stack>
        )}

      </Container>
      {isMobile && (
        <BottomArea position="fixed" bottom={BottomNavigation.HEIGHT}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate(AppRoute.여행_생성)}
          >
            새 여행
          </Button>
        </BottomArea>
      )}
    </>
  )
}
