import { Skeleton, Stack, Typography, type StackProps } from "@mui/material";
import { TripChecklist } from './TripChecklist';
import { useTripChecklist } from "./useTripChecklist";
import { ListItem } from "~shared/components/ListItem";
import { Suspense } from "react";

interface Props extends StackProps {
  tripId: string;
  throwOnEmpty?: boolean;
}


export function TripDeadlineChecklist(props: Props) {
  return (
    <Suspense fallback={<Pending {...props} />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, throwOnEmpty, ...props }: Props) {
  const { data: { deadlines } } = useTripChecklist(tripId);

  if (deadlines.length === 0 && throwOnEmpty) {
    throw new Error('체크리스트가 없습니다.');
  }

  return (
    <Stack {...props}>
      {deadlines.length > 0 ? (
        deadlines.map(x => (
          <TripChecklist.ReadonlyItem
            key={x.id}
            id={x.id}
            tripId={tripId}
          />
        ))
      ) : <Typography variant="body2" color="textSecondary" paddingY={3}>모든 사항을 점검했어요</Typography>}

    </Stack>
  )
}

function Pending(props: StackProps) {
  return (
    <Stack {...props}>
      {Array.from({ length: 2 }).map((_, key) => (
        <ListItem key={key}>
          <Skeleton />
        </ListItem>
      ))}
    </Stack>
  )
}