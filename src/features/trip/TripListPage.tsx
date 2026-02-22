import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Stack,
} from '@mui/material'
import { TripFormDialog } from './TripFormDialog'
import { useTrips } from './useTrips'

export function TripListPage() {
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: trips, create } = useTrips()

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
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
          <Typography color="text.secondary">
            아직 여행이 없어요. 새 여행을 만들어보세요!
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {trips.map((trip) => (
            <Card key={trip.id}>
              <CardActionArea onClick={() => navigate(`/trip/${trip.id}`)}>
                <CardContent>
                  <Typography variant="h6">{trip.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {trip.startDate} ~ {trip.endDate}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
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