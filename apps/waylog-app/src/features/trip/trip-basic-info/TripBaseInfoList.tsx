import { Skeleton, Stack, Typography, type StackProps } from "../../../shared/components/mui";
import { Suspense } from "react";
import { formatShortDate } from "@waylog/domains/utils";
import { useTrip } from "@waylog/domains/trip";

interface Props extends Omit<StackProps, 'direction'> {
  tripId: string;
  editable?: boolean;
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

function Resolved({ tripId, editable, size, direction, ...props }: Props) {
  const { data: trip } = useTrip(tripId);

  return (
    <Stack
      gap={2}
      direction="column"
      {...props}
    >
      <Stack direction={direction === 'horizontal' ? 'row' : 'column'} justifyContent={direction === 'horizontal' ? 'space-between' : undefined}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          목적지
        </Typography>
        <Typography variant={size === 's' ? 'body2' : "body1"}>{trip.destinations.join(', ')}</Typography>
      </Stack>
      <Stack direction={direction === 'horizontal' ? 'row' : 'column'} justifyContent={direction === 'horizontal' ? 'space-between' : undefined}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          여행 기간
        </Typography>
        {/* 웹 모바일도 기간 편집을 노출하지 않는다 (editable 미사용) */}
        <Typography variant={size === 's' ? 'body2' : "body1"}>
          {formatShortDate(trip.startDate)} ~ {formatShortDate(trip.endDate)}
        </Typography>
      </Stack>
    </Stack>
  )
}


function Pending({ size, direction, ...props }: Omit<Props, 'tripId'>) {
  return (
    <Stack
      gap={2}
      direction={direction === 'horizontal' ? 'column' : 'row'}
      justifyContent={direction === 'horizontal' ? 'space-between' : undefined}
      {...props}
    >
      <Stack direction={direction === 'horizontal' ? 'column' : 'row'}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          목적지
        </Typography>
        <Skeleton variant="text" />
      </Stack>
      <Stack direction={direction === 'horizontal' ? 'column' : 'row'}>
        <Typography variant={size === 's' ? "caption" : "subtitle2"} color="text.secondary">
          여행 기간
        </Typography>
        <Skeleton variant="text" />
      </Stack>
    </Stack>
  )
}