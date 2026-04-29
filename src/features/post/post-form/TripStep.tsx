import { Box, Button, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useState } from 'react'
import { BottomArea } from '~shared/components/BottomArea'
import { useTrips } from '~features/trip/useTrips'

interface Props {
  defaultValue: string | null
  onNext: (tripId: string) => void
}

export function TripStep({ defaultValue, onNext }: Props) {
  const { data: trips } = useTrips()
  const [tripId, setTripId] = useState<string | null>(defaultValue)

  return (
    <>
      <Box px={3} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        {trips.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            먼저 여행을 만들어주세요
          </Typography>
        ) : (
          <List>
            {trips.map((trip) => (
              <ListItemButton
                key={trip.id}
                selected={tripId === trip.id}
                onClick={() => setTripId(trip.id)}
              >
                <ListItemText
                  primary={trip.name}
                  secondary={`${trip.startDate} ~ ${trip.endDate}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      <BottomArea>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={tripId == null}
          onClick={() => tripId && onNext(tripId)}
        >
          다음
        </Button>
      </BottomArea>
    </>
  )
}

const BOTTOM_AREA_HEIGHT = 64
