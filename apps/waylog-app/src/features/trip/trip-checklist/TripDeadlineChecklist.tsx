import { Skeleton, Stack, Typography, type StackProps } from "../../../shared/components/mui";
import { TripChecklist } from './TripChecklist';
import { useTripChecklist } from '@waylog/domains/trip-checklist';
import { ListItem } from "../../../shared/components/ListItem";
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

  // 웹은 throw 로 ErrorBoundary 가 섹션을 숨기지만, RN 개발 빌드는
  // redbox 를 먼저 띄운다. 같은 결과를 null 로 만든다.
  if (deadlines.length === 0 && throwOnEmpty) return null;


  return (
    <Stack gap={1} sx={{ width: '100%' }}>
      <Typography variant="subtitle2" color="text.secondary">
        해야할 일
      </Typography>
      <Stack {...props}>
      {deadlines.length > 0 ? (
        deadlines.map(x => (
          <TripChecklist.ReadonlyItem
            key={x.id}
            id={x.id}
            tripId={tripId}
          />
        ))
      ) : <Typography variant="body2" color="text.secondary" sx={{ paddingVertical: 24 }}>모든 사항을 점검했어요</Typography>}
      </Stack>
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