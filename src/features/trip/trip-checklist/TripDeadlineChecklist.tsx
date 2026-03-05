import { Stack, Typography, type StackProps } from "@mui/material";
import { TripChecklist } from './TripChecklist';
import { useTripChecklist } from "./useTripChecklist";

interface Props extends StackProps {
  tripId: string;
}


export function TripDeadlineChecklist({ tripId, ...props }: Props) {
  const { data: { deadlines } } = useTripChecklist(tripId);

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