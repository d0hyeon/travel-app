import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, IconButton, Skeleton, Stack, Typography, type ButtonProps, type StackProps } from "@mui/material";
import { Suspense } from "react";
import { toast } from "sonner";
import { useScheduledTrips } from "~features/trip/useScheduledTrips";
import { BottomArea } from "~shared/components/BottomArea";
import { createTripPlace } from "./place.api";
import { PlaceMap } from "./PlaceMap";
import { PlacePhotoList } from "./PlacePhotoList";
import { usePlace } from "./usePlace";
import { useTripSelectSheet } from './useTripSelectSheet';

interface Props extends StackProps {
  placeId: string;
}

export function PlaceInfoWidget(props: Props) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ placeId, ...props }: Props) {
  const { data: place } = usePlace(placeId);
  const { data: scheduledTrips } = useScheduledTrips();

  return (
    <Stack spacing={2} paddingBottom={6} {...props}>
      <Box sx={{ height: 200, borderRadius: 1, overflow: 'hidden' }}>
        <Suspense >
          <PlaceMap placeId={place.id} height="100%" />
        </Suspense>
      </Box>
      <Stack spacing={1} paddingX={1.5}>
        {place.address && (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Typography variant="body2" color="text.secondary">
              {place.address}
            </Typography>
            <IconButton
              size="small"
              onClick={async () => {
                await navigator.clipboard.writeText(place.address);
                toast.success('주소가 복사되었어요');
              }}
            >
              <ContentCopyIcon fontSize="small" color="disabled" />
            </IconButton>
          </Stack>
        )}
      </Stack>
      <PlacePhotoList direction="row" placeId={place.id} sx={{ overflowX: 'auto', paddingX: 1.5 }} />
      {scheduledTrips.length > 0 && (
        <BottomArea position="absolute" left={0}>
          <AddTripButton placeId={place.id} variant="contained" size="large" fullWidth>
            내 여행에 담기
          </AddTripButton>
        </BottomArea>
      )}
    </Stack>
  )
}

function Pending() {
  return (
    <Stack spacing={2}>
      <Skeleton height={200} />
      <Skeleton variant="text" />

      <Stack direction="row" spacing={1}>
        <Skeleton variant="rectangular" width={100} height={80} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={80} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={80} sx={{ borderRadius: 1 }} />
      </Stack>
    </Stack>
  )
}

interface AddTripButtonProps extends ButtonProps {
  placeId: string;
}
function AddTripButton({ placeId, onClick, ...props }: AddTripButtonProps) {
  const { data: place } = usePlace(placeId);
  const { data: scheduledTrips } = useScheduledTrips();

  const selectTrips = useTripSelectSheet(scheduledTrips);
  const getTargetTrip = () => {
    if (scheduledTrips.length === 1) return scheduledTrips.at(0);
    return selectTrips();
  }


  return (
    <Button
      onClick={async (event) => {
        const targetTrip = await getTargetTrip();
        if (targetTrip) {
          await createTripPlace({ placeId: place.id, tripId: targetTrip.id });
          toast.success(`${targetTrip.name}에 추가되었어요`);
        }
        onClick?.(event);
      }}
      fullWidth
      {...props}
    />
  )
}