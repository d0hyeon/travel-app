import DeleteIcon from '@mui/icons-material/Delete'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { Link, useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { ListItem } from '../../shared/components/ListItem'
import { TripFormDialog } from './TripFormDialog'
import { useAuth } from '~features/auth/useAuth'
import { useTrips } from './useTrips'

export default function TripListPage() {
  const confirm = useConfirmDialog()

  const { data: trips, create, remove, leave } = useTrips();
  const { data: currentUser } = useAuth();
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
            <Stack key={trip.id} direction="row" alignItems="center" gap={1}>
              <Link to={`/trip/${trip.id}`} style={{ flex: 1 }}>

                <ListItem
                  leftAddon={<ListItem.Ordering>{idx + 1}</ListItem.Ordering>}
                  rightAddon={
                    trip.userId === currentUser?.id ? (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async (e) => {
                          e.preventDefault()
                          if (await confirm(`"${trip.name}" 여행을 삭제하시겠습니까?`)) {
                            await remove(trip.id)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={async (e) => {
                          e.preventDefault()
                          if (await confirm(`"${trip.name}" 여행에서 나가시겠습니까?`)) {
                            await leave(trip.id)
                          }
                        }}
                      >
                        <ExitToAppIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItem.Title>{trip.name}</ListItem.Title>
                  <ListItem.Text>{trip.startDate} ~ {trip.endDate}</ListItem.Text>
                </ListItem>
              </Link>

            </Stack>
          ))}
        </Stack>
      )}
    </Container>
  )
}
