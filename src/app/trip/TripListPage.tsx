import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { Link, useNavigate } from 'react-router'
import { ListItem } from '../../shared/components/ListItem'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { useTrips } from './useTrips'

export default function TripListPage() {
  const navigate = useNavigate()
  const confirm = useConfirmDialog()

  const { data: trips, remove } = useTrips();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          내 여행
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/trip/new')}
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
                  rightAddon={(
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
                  )}
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
