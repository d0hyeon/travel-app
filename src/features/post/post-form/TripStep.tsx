import { Box, Button, List, ListItemButton, ListItemText, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { BottomArea } from '~shared/components/BottomArea'
import { useTrips } from '~features/trip/useTrips'

interface Props {
  defaultValue: string | null
  onNext: (tripId: string | null) => void
}

export function TripStep({ defaultValue, onNext }: Props) {
  const { data: trips } = useTrips()
  const [tripId, setTripId] = useState<string | null>(defaultValue)

  return (
    <>
      <Box px={3} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Typography variant="body2" color="text.secondary" pt={2}>
          포스트를 어떤 여행에 묶을까요? 묶지 않으면 개인 피드 포스트가 됩니다.
        </Typography>
        {trips.length === 0 ? (
          <Typography variant="body2" color="text.secondary" pt={2}>
            아직 여행이 없어요. "여행 없이"로 진행할 수 있어요.
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
        <Stack direction="row" gap={1} width="100%">
          <Button
            variant="outlined"
            size="large"
            onClick={() => onNext(null)}
            sx={{ flex: 1 }}
          >
            여행 없이
          </Button>
          <Button
            variant="contained"
            size="large"
            disabled={tripId == null}
            onClick={() => tripId && onNext(tripId)}
            sx={{ flex: 1 }}
          >
            다음
          </Button>
        </Stack>
      </BottomArea>
    </>
  )
}

const BOTTOM_AREA_HEIGHT = 64
