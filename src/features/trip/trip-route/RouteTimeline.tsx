import { Box, Stack, styled, Typography, type StackProps } from '@mui/material';
import type { TripPlace } from '../../place/place.types';
import { formatDistance, formatDuration } from '../../../shared/utils/formats';
import { TransportIcon } from './TransportIcon';
import { useRouteLegs } from './useRouteLegs';

// 경로 순서를 나타내는 번호 원. 연결선이 이 폭의 중심에 정렬되도록 크기를 공유한다.
const DOT_SIZE = 18;


interface RouteLegConnectorProps extends StackProps {
  waypoints: (TripPlace & { id: string })[];
  arrivalPlaceId: string;
}



// 직전 방문 장소에서 이 장소까지를 잇는 세로 연결선과 이동 예상시간·거리를 표시한다.
export function RouteLegConnector({ waypoints, arrivalPlaceId, ...props }: RouteLegConnectorProps) {
  const legByArrivalPlaceId = useRouteLegs(waypoints);
  const leg = legByArrivalPlaceId.get(arrivalPlaceId);

  if (!leg || leg.duration === 0) return null;

  return (
    <Container {...props}>
      <Line />
      <Chip>
        <TransportIcon transport={leg.transport} sx={{ fontSize: 14 }} />
        <Typography variant="caption">
          {formatDuration(leg.duration)} · {formatDistance(leg.distance)}
        </Typography>
      </Chip>
    </Container>
  );
}


const Container = styled(Stack)({
  width: '100%',
  position: 'relative',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',

})


export const Dot = styled(Box)(({ theme }) => ({
  minWidth: DOT_SIZE,
  minHeight: DOT_SIZE,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 'bold',
  flexShrink: 0,
}));

const Line = styled(Box)(({ theme }) => ({
  position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
  height: '100%', width: 2,
  backgroundColor: theme.palette.divider
}))

const Chip = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.2)',
  background: theme.palette.background.default,
  zIndex: 10,
  gap: 0.5,
  paddingInline: 8
}))