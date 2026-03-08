import PushPinIcon from '@mui/icons-material/PushPin';
import { Stack, Typography, type StackProps } from "@mui/material";
import { Suspense } from "react";
import { ListItem } from "~shared/components/ListItem";
import { useTripMemo } from "./useTripMemo";

interface Props extends StackProps {
  tripId: string;
}

export function TripPinnedMemos({ tripId, ...props }: Props) {
  return (
    <Suspense fallback={null}>
      <TripPinnedMemosContent tripId={tripId} {...props} />
    </Suspense>
  );
}

function TripPinnedMemosContent({ tripId, ...props }: Props) {
  const { data: { pinnedMemos } } = useTripMemo(tripId);

  if (pinnedMemos.length === 0) return null;

  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        고정된 메모
      </Typography>
      <Stack gap={1}>
        {pinnedMemos.map((memo) => (
          <ListItem
            key={memo.id}
            leftAddon={<PushPinIcon fontSize="small" color="primary" />}
            sx={{
              borderColor: 'primary.main',
              borderWidth: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {memo.content}
            </Typography>
          </ListItem>
        ))}
      </Stack>
    </Stack>
  );
}
