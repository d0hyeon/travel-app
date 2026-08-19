import { Badge, Chip, Stack, Typography } from "@mui/material";
import { formatDate } from "date-fns";
import { useCallback } from "react";
import { getTripDuration } from "~features/trip/trip-list/trip-list.utils";
import type { Trip } from "@waylog/domains/trip";
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet";
import { useOverlay } from "~shared/hooks/useOverlay";

/** @package { PlaceInfoWIdget.tsx } */
export function useTripSelectSheet(options: Trip[]) {
  const overlay = useOverlay();

  return useCallback(() => {
    return new Promise<Trip | null>((resolve) => {
      overlay.open(({ isOpen, close, onClose }) => (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => {
            resolve(null)
            onClose();
          }}
        >
          <BottomSheet.Header>
            내 여행 선택
          </BottomSheet.Header>
          <BottomSheet.Scrollable>
            <BottomSheet.Body>
              <Stack gap={2.5} paddingX={1} marginTop={1}>
                {options.map(trip => {
                  const { days, nights } = getTripDuration(trip.startDate, trip.endDate);

                  return (
                    <Stack
                      component="button"
                      key={trip.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1}
                      onClick={() => {
                        resolve(trip)
                        close();
                      }}
                    >
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        <Chip variant="outlined" size="small" label={trip.destinations.join(', ')} sx={{ fontSize: 11, height: 20 }} />
                        <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1 }}>
                          {trip.name} 여행
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(trip.startDate, 'M월 d일')} ~ {formatDate(trip.endDate, 'M월 d일')}&nbsp;
                        ({nights}박 {days}일)
                      </Typography>
                    </Stack>
                  )
                })}
              </Stack>
            </BottomSheet.Body>
          </BottomSheet.Scrollable>
        </BottomSheet>
      ))
    })
  }, [])
}