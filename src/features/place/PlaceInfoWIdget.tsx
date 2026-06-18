import { Box, Skeleton, Stack, Typography, type StackProps } from "@mui/material";
import { Suspense } from "react";
import { PlaceMap } from "./PlaceMap";
import { PlacePhotoList } from "./PlacePhotoList";
import { usePlace } from "./usePlace";

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
  const { data: place } = usePlace(placeId)

  return (
    <Stack spacing={2} {...props}>
      <Box sx={{ height: 200, borderRadius: 1, overflow: 'hidden' }}>
        <Suspense >
          <PlaceMap placeId={place.id} height="100%" />
        </Suspense>
      </Box>
      <Stack spacing={1} paddingX={1.5}>
        {place.address && (
          <Typography variant="body2" color="text.secondary">
            {place.address}
          </Typography>
        )}
      </Stack>
      <PlacePhotoList direction="row" placeId={place.id} sx={{ overflowX: 'auto', paddingX: 1.5 }} />
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