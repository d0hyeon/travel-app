import { formatTripDate, getTripDuration, type Trip } from '@waylog/domains/modules/trip'
import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Chip, Stack, Typography } from '../../shared/components/mui'
import { useOverlay } from '../../shared/hooks/useOverlay'

/** @package { place-detail/PlaceDetailSheet.tsx } */
export function useTripSelectSheet(options: Trip[]) {
  const overlay = useOverlay()

  return useCallback(() => {
    return new Promise<Trip | null>((resolve) => {
      overlay.open(({ isOpen, close, onClose }) => (
        <BottomSheet
          isOpen={isOpen}
          onDismiss={() => {
            resolve(null)
            onClose()
          }}
          safeArea
        >
          <BottomSheet.Header>내 여행 선택</BottomSheet.Header>
          <BottomSheet.Body>
            <Stack gap={2}>
              {options.map((trip) => {
                const { days, nights } = getTripDuration(trip.startDate, trip.endDate)

                return (
                  <Pressable
                    key={trip.id}
                    onPress={() => {
                      resolve(trip)
                      close()
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        <Chip variant="outlined" size="small" label={trip.destinations.join(', ')} />
                        <Typography variant="body2" color="text.secondary">
                          {trip.name} 여행
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)} ({nights}박 {days}일)
                      </Typography>
                    </Stack>
                  </Pressable>
                )
              })}
            </Stack>
          </BottomSheet.Body>
        </BottomSheet>
      ))
    })
  }, [options, overlay])
}
