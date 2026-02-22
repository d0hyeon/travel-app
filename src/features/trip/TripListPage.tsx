import {
  Box,
  Button,
  Container,
  Stack,
  Typography
} from '@mui/material'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListItem } from '../../shared/components/ListItem'
import { TripFormDialog } from './TripFormDialog'
import { useTrips } from './useTrips'

export function TripListPage() {
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: trips, create } = useTrips()

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          내 여행
        </Typography>
        <Button
          variant="contained"
          onClick={() => setIsDialogOpen(true)}

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

      <TripFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={(data) => create(data, { onSuccess: () => setIsDialogOpen(false) })}
      />
    </Container>
  )
}