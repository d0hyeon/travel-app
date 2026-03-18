import PushPinIcon from '@mui/icons-material/PushPin';
import { Skeleton, Stack, Typography, type StackProps } from "@mui/material";
import { Suspense } from "react";
import { ListItem } from "~shared/components/ListItem";
import { useTripMemo } from "./useTripMemo";

interface Props extends StackProps {
  tripId: string;
  throwOnEmpty?: boolean;
}

export function TripPinnedMemos({ tripId, ...props }: Props) {
  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        고정된 메모
      </Typography>
      <Suspense fallback={(
        <ListItem>
          <Skeleton variant='text' />
        </ListItem>
      )}>
        <TripPinnedMemosContent tripId={tripId} {...props} />
      </Suspense>
    </Stack>
  );
}

function TripPinnedMemosContent({ tripId, throwOnEmpty, ...props }: Props) {
  const { data: { pinnedMemos } } = useTripMemo(tripId);

  if (pinnedMemos.length === 0) {
    if (throwOnEmpty) throw new Error('메모가 없습니다.')
    return null;
  }

  return (
    <Stack gap={1}>
      {pinnedMemos.map((memo) => (
        <ListItem
          key={memo.id}
          leftAddon={<PushPinIcon fontSize="small" color="primary" sx={{ width: 16 }} />}
          sx={{
            paddingY: 1,
            boxShadow: '0px 2px 8px #ddd'
          }}
        >
          <Typography
            variant="caption"
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
  );
}
