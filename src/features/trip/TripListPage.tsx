import {
  Box,
  Button,
  Container,
  Stack,
  Typography
} from '@mui/material'
import { Link, useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { ListItem } from '../../shared/components/ListItem'
import { TripFormDialog } from './TripFormDialog'
import { useTrips } from './useTrips'

export default function TripListPage() {
  const { data: trips, create } = useTrips();
  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" >
          내 여행
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            if (isMobile) {
              return navigate(AppRoute.여행_생성);
            }

            overlay.open(({ isOpen, close }) => (
              <TripFormDialog
                open={isOpen}
                onClose={close}
                onSubmit={async (data) => {
                  const trip = await create({
                    ...data,
                    isOverseas: isOverseasByCoordinate(data.lat, data.lng),
                    exchangeRate: null,
                    exchangeRates: null
                  })
                  navigate(`/trip/${trip.id}`)
                }}
              />
            ))
          }}
        >
          새 여행
        </Button>
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
  )
}
