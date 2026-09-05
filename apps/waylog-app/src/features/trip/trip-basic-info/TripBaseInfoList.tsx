import { Skeleton, Stack, Typography, type StackProps } from "../../../shared/components/mui";
import { Suspense } from "react";
import { formatShortDate } from "@waylog/utility";
import { useTrip } from "@waylog/domains/modules/trip";

interface Props extends Omit<StackProps, 'direction'> {
  tripId: string;
  size?: 'm' | 's';
  direction?: 'vertical' | 'horizontal'
}

export function TripBaseInfoList({ direction = 'vertical', size = 'm', ...props }: Props) {
  return (
    <Suspense fallback={<Pending direction={direction} size={size} {...props} />}>
      <Resolved direction={direction} size={size} {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, size, direction, ...props }: Props) {
  const { data: trip } = useTrip(tripId);
  const rowProps = toRowProps(direction);

  return (
    <Stack
      gap={2}
      direction="column"
      {...props}
    >
      <Stack {...rowProps}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          목적지
        </Typography>
        <Typography variant={size === 's' ? 'body2' : "body1"}>{trip.destinations.join(', ')}</Typography>
      </Stack>
      <Stack {...rowProps}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          여행 기간
        </Typography>
        <Typography variant={size === 's' ? 'body2' : "body1"}>
          {formatShortDate(trip.startDate)} ~ {formatShortDate(trip.endDate)}
        </Typography>
      </Stack>
    </Stack>
  )
}


function Pending({ size, direction, ...props }: Omit<Props, 'tripId'>) {
  const rowProps = toRowProps(direction);

  return (
    <Stack
      gap={2}
      direction="column"
      {...props}
    >
      <Stack {...rowProps}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          목적지
        </Typography>
        <Skeleton variant="text" />
      </Stack>
      <Stack {...rowProps}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          여행 기간
        </Typography>
        <Skeleton variant="text" />
      </Stack>
    </Stack>
  )
}

function toRowProps(direction: 'vertical' | 'horizontal' = 'vertical') {
  return direction === 'horizontal'
    ? { direction: 'row' as const, justifyContent: 'space-between' as const }
    : { direction: 'column' as const }
}